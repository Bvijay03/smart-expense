import { useState, useCallback } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Animated,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { groupService, sharedExpenseService } from "@/shared/services/modules";
import { Card } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { useAuthStore } from "@/modules/authentication/store/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "GroupDetail">;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"Expenses" | "Settlements" | "Admin">("Expenses");

  const [quickName, setQuickName] = useState("");
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id;

  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupService.get(groupId).then((r) => r.data.data),
  });

  const expenses = useQuery({
    queryKey: ["shared-expenses", groupId],
    queryFn: () => sharedExpenseService.list(groupId).then((r) => r.data.data),
  });

  const joinRequests = useQuery({
    queryKey: ["join-requests", groupId],
    queryFn: () => groupService.listJoinRequests(groupId).then((r) => r.data.data),
    enabled: !!group.data?.members?.some(
      (m) => m.user.id === currentUserId && m.role === "ADMIN"
    ),
    refetchInterval: 15000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([group.refetch(), expenses.refetch(), joinRequests.refetch()]);
    setRefreshing(false);
  }, [group, expenses, joinRequests]);

  const addMember = useMutation({
    mutationFn: (name: string) => groupService.addMember(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      setQuickName("");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const deleteGroup = useMutation({
    mutationFn: () => groupService.delete(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      navigation.goBack();
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const handleJoinRequest = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "approve" | "reject" }) =>
      groupService.handleJoinRequest(groupId, requestId, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      Alert.alert("Done", action === "approve" ? "Member added!" : "Request declined.");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmDeleteGroup = () => {
    Alert.alert("Delete Group", `Delete "${group.data?.name ?? groupName}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGroup.mutate() },
    ]);
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await groupService.generateInviteCode(groupId);
      setGeneratedCode(res.data.data.inviteCode);
      setCodeExpiresAt(res.data.data.expiresAt);
      setInviteModalVisible(true);
    } catch (err: any) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setGeneratingCode(false);
    }
  };

  if (group.isLoading) return <LoadingState />;
  if (group.isError) return <ErrorState message="Failed to load group" onRetry={group.refetch} />;

  const members = group.data?.members?.map((m) => ({ id: m.user.id, name: m.user.name })) ?? [];
  const totalExpenses = expenses.data?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const isAdmin = group.data?.members?.some((m) => m.user.id === currentUserId && m.role === "ADMIN");
  const pendingRequests = joinRequests.data ?? [];

  const currentUserMember = group.data?.members?.find(m => m.user.id === currentUserId);
  const userNetBalance = currentUserMember?.balance?.net ?? 0;

  // Gather all settlements (owesTo)
  const allSettlements: any[] = [];
  group.data?.members?.forEach(m => {
    m.owesTo?.forEach(d => {
      allSettlements.push({ fromUserId: m.user.id, fromName: m.user.name, toName: d.name, amount: d.amount });
    });
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── TopAppBar ── */}
      <View style={[styles.topAppBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.appBarBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>{group.data?.name ?? groupName}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("EditGroup", {
            groupId,
            name: group.data?.name ?? groupName,
            description: group.data?.description ?? null,
          })} style={styles.appBarBtn}>
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Group Summary Hero ── */}
        <View style={[styles.heroCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
          <View style={[styles.heroOrb, { backgroundColor: colors.primary + "33" }]} />
          
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>TOTAL GROUP BALANCE</Text>
            <Text style={[styles.heroTotal, { color: colors.text }]}>₹{totalExpenses.toFixed(2)}</Text>
          </View>

          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

          <View style={styles.heroRight}>
            <Text style={styles.heroLabel}>YOUR BALANCE</Text>
            <View style={styles.heroBalanceRow}>
              {userNetBalance > 0 ? (
                <>
                  <Ionicons name="trending-up" size={20} color={colors.success} />
                  <Text style={[styles.heroBalanceText, { color: colors.success }]}>You are owed ₹{userNetBalance.toFixed(0)}</Text>
                </>
              ) : userNetBalance < 0 ? (
                <>
                  <Ionicons name="trending-down" size={20} color={colors.error} />
                  <Text style={[styles.heroBalanceText, { color: colors.error }]}>You owe ₹{Math.abs(userNetBalance).toFixed(0)}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.heroBalanceText, { color: colors.textSecondary }]}>All settled up</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Tab Navigation ── */}
        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === "Expenses" && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab("Expenses")}
          >
            <Text style={[styles.tabText, activeTab === "Expenses" ? { color: colors.primary, fontWeight: "700" } : { color: colors.textSecondary }]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === "Settlements" && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab("Settlements")}
          >
            <Text style={[styles.tabText, activeTab === "Settlements" ? { color: colors.primary, fontWeight: "700" } : { color: colors.textSecondary }]}>
              Settlements
            </Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === "Admin" && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab("Admin")}
            >
              <Text style={[styles.tabText, activeTab === "Admin" ? { color: colors.primary, fontWeight: "700" } : { color: colors.textSecondary }]}>
                Admin
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Tab Content ── */}
        {activeTab === "Expenses" && (
          <View style={styles.bentoGrid}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickAddBtnAction, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.primary + "4D" }]}
                onPress={() => navigation.navigate("AddSharedExpense", { groupId, members })}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
                <Text style={[styles.quickAddText, { color: colors.primary }]}>Add Expense</Text>
              </TouchableOpacity>
              
              <View style={[styles.groupMembersCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
                <Text style={[styles.groupMembersTitle, { color: colors.text }]}>Group Members</Text>
                <View style={styles.avatarsRow}>
                  {members.slice(0, 3).map((m, i) => (
                    <View key={m.id} style={[styles.avatarCircle, { backgroundColor: colors.surfaceVariant, borderColor: colors.surface, zIndex: 3 - i }]}>
                      <Text style={[styles.avatarText, { color: colors.textSecondary }]}>{m.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  ))}
                  {members.length > 3 ? (
                    <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceVariant, borderColor: colors.surface, zIndex: 0 }]}>
                      <Text style={[styles.avatarText, { color: colors.textSecondary }]}>+{members.length - 3}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.avatarCircle, { backgroundColor: colors.surfaceVariant, borderColor: colors.surface, zIndex: 0 }]}
                      onPress={() => setActiveTab("Admin")}
                    >
                      <Ionicons name="add" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.recentTransactions}>
              <Text style={[styles.transactionsTitle, { color: colors.text }]}>Recent Transactions</Text>
              
              {expenses.data?.length ? expenses.data.map(exp => (
                <TouchableOpacity key={exp.id} style={[styles.transactionItem, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}
                  onPress={() => navigation.navigate("SharedExpenseDetail", { expenseId: exp.id, groupId })}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: colors.surfaceVariant }]}>
                      <Ionicons name="receipt" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.transactionDesc, { color: colors.text }]}>{exp.description}</Text>
                      <Text style={[styles.transactionPayer, { color: colors.textSecondary }]}>Paid by {exp.paidBy.name}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: colors.text }]}>₹{exp.amount.toFixed(2)}</Text>
                    <View style={[styles.transactionDateBadge, { backgroundColor: colors.surfaceVariant, borderColor: "rgba(255,255,255,0.05)" }]}>
                      <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                        {new Date(exp.expenseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )) : (
                <View style={styles.emptyTransactions}>
                  <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No expenses yet</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Settlements Tab ── */}
        {activeTab === "Settlements" && (
          <View style={styles.settlementsSection}>
            <View style={styles.settlementHeader}>
              <Ionicons name="git-network-outline" size={20} color={colors.primary} />
              <Text style={[styles.settlementTitle, { color: colors.text }]}>Settlement Logic</Text>
            </View>

            <View style={styles.settlementGrid}>
              {allSettlements.length > 0 ? (
                allSettlements.map((s, idx) => (
                  <View key={idx} style={[styles.settlementCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", borderLeftColor: colors.success }]}>
                    <View style={styles.settlementLeft}>
                      <View style={[styles.settlementAvatar, { backgroundColor: colors.surfaceVariant, borderColor: colors.surface }]}>
                        <Text style={[styles.settlementAvatarText, { color: colors.textSecondary }]}>{s.fromName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={[styles.settlementDesc, { color: colors.text }]}>
                          {s.fromUserId === currentUserId ? "You pay " : `${s.fromName} pays `}
                          {s.toName}
                        </Text>
                        <Text style={[styles.settlementAmount, { color: colors.success }]}>₹{s.amount.toFixed(2)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.markSettledBtn, { backgroundColor: colors.success + "1A", borderColor: colors.success + "4D" }]}
                      onPress={() => navigation.navigate("Settlements", { groupId, groupName: group.data?.name ?? groupName })}>
                      <Text style={[styles.markSettledText, { color: colors.success }]}>Settle</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptySettlements}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>All settled up!</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Admin Tab ── */}
        {activeTab === "Admin" && (
          <View style={styles.adminSection}>
            <TouchableOpacity
              style={[styles.inviteCodeBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "33" }]}
              onPress={handleGenerateCode}
              disabled={generatingCode}
            >
              <Ionicons name="key-outline" size={20} color={colors.primary} />
              <Text style={[styles.inviteCodeBtnText, { color: colors.primary }]}>
                {generatingCode ? "Generating..." : "Generate Invite Code"}
              </Text>
            </TouchableOpacity>

            <View style={[styles.quickAdd, { borderColor: colors.border }]}>
              <Ionicons name="person-add-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.quickAddInput, { color: colors.text }]}
                placeholder="Add member by name..."
                placeholderTextColor={colors.textSecondary}
                value={quickName}
                onChangeText={setQuickName}
                returnKeyType="done"
                onSubmitEditing={() => quickName.trim() && addMember.mutate(quickName.trim())}
              />
              {quickName.trim() ? (
                <TouchableOpacity
                  style={[styles.quickAddSubmitBtn, { backgroundColor: colors.primary }]}
                  onPress={() => quickName.trim() && addMember.mutate(quickName.trim())}
                >
                  <Ionicons name="add" size={18} color="#000" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.error + "18", borderColor: colors.error + "44", marginTop: spacing.md }]}
              onPress={confirmDeleteGroup}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Delete Group</Text>
            </TouchableOpacity>
            
            {pendingRequests.length > 0 && (
              <View style={styles.requestsContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Join Requests</Text>
                {pendingRequests.map((req: any) => (
                  <View key={req.id} style={[styles.requestRowCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
                    <View style={styles.requestInfo}>
                      <Text style={[styles.requestName, { color: colors.text }]}>{req.user.name}</Text>
                      <Text style={[styles.requestEmail, { color: colors.textSecondary }]}>{req.user.email}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.requestActionBtn, { backgroundColor: colors.success + "18" }]}
                        onPress={() => handleJoinRequest.mutate({ requestId: req.id, action: "approve" })}
                      >
                        <Ionicons name="checkmark" size={20} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.requestActionBtn, { backgroundColor: colors.error + "18" }]}
                        onPress={() => handleJoinRequest.mutate({ requestId: req.id, action: "reject" })}
                      >
                        <Ionicons name="close" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB - Always visible on Expenses tab for quick add */}
      {activeTab === "Expenses" && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          onPress={() => {
            if (currentUserId && currentUser) {
              navigation.navigate("MemberActivity", { 
                groupId, 
                groupName: group.data?.name ?? groupName,
                memberId: currentUserId,
                memberName: currentUser.name
              });
            }
          }}
        >
          <Ionicons name="receipt" size={24} color="#000" />
        </TouchableOpacity>
      )}

      {/* ── Invite Code Modal ── */}
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInviteModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Ionicons name="key" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Invite Code</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Share this code with others to let them request to join this group
                </Text>
              </View>
              <View style={[styles.codeDisplay, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.codeText, { color: colors.primary }]}>{generatedCode}</Text>
              </View>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
                onPress={() => setInviteModalVisible(false)}
              >
                <Text style={styles.closeModalBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  appBarBtn: { padding: 8, borderRadius: 20 },
  appBarTitle: { fontSize: 20, fontWeight: "700" },
  content: { padding: spacing.md, paddingBottom: 100 },
  
  // Hero
  heroCard: {
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  heroOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    opacity: 0.5,
  },
  heroLeft: { flex: 1, alignItems: "flex-start" },
  heroRight: { flex: 1, alignItems: "flex-end" },
  heroDivider: { width: 1, height: 64, marginHorizontal: spacing.md },
  heroLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 4, color: "#849495" },
  heroTotal: { fontSize: 32, fontWeight: "700" },
  heroBalanceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroBalanceText: { fontSize: 16, fontWeight: "600" },
  
  // Tabs
  tabContainer: { flexDirection: "row", borderBottomWidth: 1, marginBottom: spacing.md },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 16 },

  // Bento Grid (Expenses Tab)
  bentoGrid: { flexDirection: "column", gap: spacing.md },
  quickActions: { flexDirection: "column", gap: spacing.md },
  quickAddBtnAction: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: spacing.sm, borderRadius: 16, borderWidth: 1,
  },
  quickAddText: { fontSize: 18, fontWeight: "600" },
  
  groupMembersCard: { padding: spacing.sm, borderRadius: 16, borderWidth: 1 },
  groupMembersTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  avatarsRow: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  avatarText: { fontSize: 12, fontWeight: "700" },
  
  recentTransactions: { gap: spacing.sm },
  transactionsTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  transactionItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.sm, borderRadius: 16, borderWidth: 1, marginBottom: spacing.sm },
  transactionLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  transactionDesc: { fontSize: 16, fontWeight: "600" },
  transactionPayer: { fontSize: 14 },
  transactionRight: { alignItems: "flex-end" },
  transactionAmount: { fontSize: 18, fontWeight: "700" },
  transactionDateBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 4 },
  transactionDate: { fontSize: 12, fontWeight: "500" },
  emptyTransactions: { padding: spacing.xl, alignItems: "center" },
  
  // Settlements Tab
  settlementsSection: { marginTop: spacing.xs },
  settlementHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  settlementTitle: { fontSize: 18, fontWeight: "600" },
  settlementGrid: { gap: spacing.sm },
  settlementCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.sm, borderRadius: 16, borderWidth: 1, borderLeftWidth: 4 },
  settlementLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  settlementAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  settlementAvatarText: { fontSize: 12, fontWeight: "700" },
  settlementDesc: { fontSize: 16 },
  settlementAmount: { fontSize: 18, fontWeight: "700" },
  markSettledBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  markSettledText: { fontSize: 12, fontWeight: "600" },
  emptySettlements: { padding: spacing.xl, alignItems: "center" },

  // Admin Tab
  adminSection: { gap: spacing.md },
  inviteCodeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  inviteCodeBtnText: { fontSize: 15, fontWeight: "600" },
  quickAdd: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10, borderStyle: "dashed",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  quickAddInput: { flex: 1, fontSize: 14 },
  quickAddSubmitBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  actionCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
  actionText: { fontSize: 15, fontWeight: "600" },
  requestsContainer: { marginTop: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  requestRowCard: { flexDirection: "row", alignItems: "center", padding: spacing.sm, borderRadius: 12, borderWidth: 1 },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 16, fontWeight: "700" },
  requestEmail: { fontSize: 13 },
  requestActions: { flexDirection: "row", gap: 8 },
  requestActionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // FAB
  fab: {
    position: "absolute", bottom: 40, right: 24,
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
    elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  modalContent: { width: "100%", maxWidth: 360, borderRadius: 20, padding: spacing.lg },
  modalHeader: { alignItems: "center", marginBottom: spacing.lg },
  modalIcon: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  codeDisplay: { paddingVertical: 18, borderRadius: 14, borderWidth: 1.5, alignItems: "center", marginBottom: spacing.sm },
  codeText: { fontSize: 36, fontWeight: "900", letterSpacing: 10 },
  closeModalBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  closeModalBtnText: { fontSize: 16, fontWeight: "700", color: "#000" },
});