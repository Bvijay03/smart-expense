import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import {
  groupService,
  sharedExpenseService,
} from "@/shared/services/modules";
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
  const [quickName, setQuickName] = useState("");
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id);

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
    // Enable for any ADMIN member, not just the creator
    enabled: !!group.data?.members?.some(
      (m) => m.user.id === currentUserId && m.role === "ADMIN"
    ),
    refetchInterval: 15000, // poll every 15s so admin sees new requests
  });

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

  const deleteExpense = useMutation({
    mutationFn: (expenseId: string) => sharedExpenseService.delete(groupId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
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

  const confirmDeleteExpense = (expenseId: string, description: string) => {
    Alert.alert("Delete Expense", `Delete "${description}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExpense.mutate(expenseId) },
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
  const isAdmin = group.data?.members?.some(
    (m) => m.user.id === currentUserId && m.role === "ADMIN"
  );
  const pendingRequests = joinRequests.data ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Header: centered group name + action icons ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
            {group.data?.name ?? groupName}
          </Text>
          {group.data?.description ? (
            <Text style={[styles.groupDesc, { color: colors.textSecondary }]} numberOfLines={1}>
              {group.data.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate("EditGroup", {
              groupId,
              name: group.data?.name ?? groupName,
              description: group.data?.description ?? null,
            })}
          >
            <Ionicons name="settings-outline" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.error + "18", borderColor: colors.error + "44" }]}
            onPress={confirmDeleteGroup}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Invite Code Button (Admin only) ── */}
      {isAdmin && (
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
      )}

      {/* ── Pending Join Requests (Admin only) ── */}
      {isAdmin && (
        <>
          <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Join Requests
            </Text>
            {pendingRequests.length > 0 && (
              <View style={[styles.badgePill, { backgroundColor: "#F59E0B" }]}>
                <Text style={styles.badgePillText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>
          {joinRequests.isLoading ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm }}>
              Loading requests...
            </Text>
          ) : pendingRequests.length === 0 ? (
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  No pending join requests
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.requestList}>
              {pendingRequests.map((req: any) => (
                <Card key={req.id}>
                  <View style={styles.requestRow}>
                    <View style={[styles.requestAvatar, { backgroundColor: "#F59E0B" + "22" }]}>
                      <Ionicons name="person-add" size={18} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requestName, { color: colors.text }]}>
                        {req.user.name}
                      </Text>
                      <Text style={[styles.requestEmail, { color: colors.textSecondary }]}>
                        {req.user.email}
                      </Text>
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
                </Card>
              ))}
            </View>
          )}
        </>
      )}

      {/* ── Member cards ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Members ({members.length})
      </Text>
      <View style={styles.memberList}>
        {group.data?.members?.map((m) => {
          const bal = m.balance ?? { paid: 0, owed: 0, net: 0 };
          const owesTo = m.owesTo ?? [];
          const getsFrom = m.getsFrom ?? [];
          const isNeutral = owesTo.length === 0 && getsFrom.length === 0;

          return (
            <Card key={m.id}>
              {/* Top row: Avatar + Name/Role + Paid/Owed */}
              <View style={styles.memberCardInner}>
                {/* Left: Avatar */}
                <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                    {m.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Center: Name + role */}
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                      {m.user.name}
                    </Text>
                    <View style={[
                      styles.roleBadge,
                      { backgroundColor: m.role === "ADMIN" ? colors.primary + "20" : colors.border },
                    ]}>
                      <Text style={[
                        styles.roleBadgeText,
                        { color: m.role === "ADMIN" ? colors.primary : colors.textSecondary },
                      ]}>
                        {m.role === "ADMIN" ? "Admin" : "Member"}
                      </Text>
                    </View>
                  </View>
                  {isNeutral && (
                    <View style={styles.memberNetRow}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
                      <Text style={[styles.memberNetText, { color: colors.textSecondary }]}>
                        All settled up
                      </Text>
                    </View>
                  )}
                </View>

                {/* Right: Paid / Owed stats */}
                <View style={styles.memberStats}>
                  <View style={styles.memberStatItem}>
                    <Text style={[styles.memberStatLabel, { color: colors.textSecondary }]}>Paid</Text>
                    <Text style={[styles.memberStatValue, { color: colors.success }]}>
                      ₹{bal.paid.toFixed(0)}
                    </Text>
                  </View>
                  <View style={[styles.memberStatDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.memberStatItem}>
                    <Text style={[styles.memberStatLabel, { color: colors.textSecondary }]}>Owed</Text>
                    <Text style={[styles.memberStatValue, { color: colors.error }]}>
                      ₹{bal.owed.toFixed(0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Debt breakdown: who they owe */}
              {owesTo.length > 0 && (
                <View style={[styles.debtSection, { borderTopColor: colors.border }]}>
                  {owesTo.map((d) => (
                    <View key={d.userId} style={styles.debtRow}>
                      <Ionicons name="arrow-forward-circle" size={16} color={colors.error} />
                      <Text style={[styles.debtText, { color: colors.text }]}>
                        Owes <Text style={{ fontWeight: "700", color: colors.error }}>₹{d.amount.toFixed(2)}</Text> to{" "}
                        <Text style={{ fontWeight: "700" }}>{d.name}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Debt breakdown: who owes them */}
              {getsFrom.length > 0 && (
                <View style={[!owesTo.length && styles.debtSection, owesTo.length > 0 && styles.debtSubSection, { borderTopColor: colors.border }]}>
                  {getsFrom.map((d) => (
                    <View key={d.userId} style={styles.debtRow}>
                      <Ionicons name="arrow-back-circle" size={16} color={colors.success} />
                      <Text style={[styles.debtText, { color: colors.text }]}>
                        Gets <Text style={{ fontWeight: "700", color: colors.success }}>₹{d.amount.toFixed(2)}</Text> from{" "}
                        <Text style={{ fontWeight: "700" }}>{d.name}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
      </View>

      {/* Quick add member */}
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
            style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
            onPress={() => quickName.trim() && addMember.mutate(quickName.trim())}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Actions ── */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "33" }]}
          onPress={() => navigation.navigate("AddSharedExpense", { groupId, members })}
        >
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.success + "12", borderColor: colors.success + "33" }]}
          onPress={() => navigation.navigate("Settlements", { groupId, groupName: group.data?.name ?? groupName })}
        >
          <Ionicons name="calculator-outline" size={28} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.success }]}>Calculate</Text>
        </TouchableOpacity>
      </View>

      {/* ── Expenses list (preview: 2 items) ── */}
      <View style={styles.expenseHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Expenses ({expenses.data?.length ?? 0})
        </Text>
        {totalExpenses > 0 && (
          <Text style={[styles.totalBadge, { color: colors.primary }]}>
            Total: ₹{totalExpenses.toFixed(2)}
          </Text>
        )}
      </View>

      {expenses.data?.length ? (
        <>
          {expenses.data.slice(0, 2).map((exp) => (
            <TouchableOpacity
              key={exp.id}
              onPress={() => navigation.navigate("SharedExpenseDetail", { expenseId: exp.id, groupId })}
            >
              <Card>
                <View style={styles.expenseRow}>
                  <View style={[styles.expenseIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>{exp.description}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      Paid by {exp.paidBy.name} · {exp.splitType} · {new Date(exp.expenseDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: "700", marginRight: 8 }}>
                    ₹{exp.amount.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => confirmDeleteExpense(exp.id, exp.description)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error ?? "#ef4444"} />
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))}

          {expenses.data.length > 2 && (
            <TouchableOpacity
              style={[styles.viewMoreBtn, { borderColor: colors.primary + "44", backgroundColor: colors.primary + "08" }]}
              onPress={() => navigation.navigate("GroupExpenses", { groupId, groupName: group.data?.name ?? groupName })}
            >
              <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                View all {expenses.data.length} expenses
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Card>
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No expenses yet</Text>
          </View>
        </Card>
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
                <Text style={[styles.codeText, { color: colors.primary }]}>
                  {generatedCode}
                </Text>
              </View>

              <View style={styles.codeInfo}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.codeInfoText, { color: colors.textSecondary }]}>
                  Expires in 24 hours
                </Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },

  // Header
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  groupName: { fontSize: 20, fontWeight: "700" },
  groupDesc: { fontSize: 13, marginTop: 2 },
  headerIcons: { flexDirection: "row", gap: 6 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },

  // Invite code button
  inviteCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  inviteCodeBtnText: { fontSize: 15, fontWeight: "600" },

  // Join Requests
  requestList: { gap: spacing.sm, marginBottom: spacing.md },
  requestRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  requestAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  requestName: { fontSize: 15, fontWeight: "700" },
  requestEmail: { fontSize: 12 },
  requestActions: { flexDirection: "row", gap: 6 },
  requestActionBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  badgePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, minWidth: 22, alignItems: "center" },
  badgePillText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // Members
  memberList: { gap: spacing.sm, marginBottom: spacing.sm },
  memberCardInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 20, fontWeight: "700" },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  memberName: { fontSize: 15, fontWeight: "700" },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: "600" },
  memberNetRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  memberNetText: { fontSize: 12, fontWeight: "600" },
  memberStats: { flexDirection: "row", alignItems: "center" },
  memberStatItem: { alignItems: "center", paddingHorizontal: 8 },
  memberStatLabel: { fontSize: 10, fontWeight: "500", marginBottom: 2 },
  memberStatValue: { fontSize: 14, fontWeight: "700" },
  memberStatDivider: { width: 1, height: 28 },

  // Debt breakdown
  debtSection: { borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm },
  debtSubSection: { marginTop: 4 },
  debtRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  debtText: { fontSize: 13 },

  // Quick add
  quickAdd: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10, borderStyle: "dashed",
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  quickAddInput: { flex: 1, fontSize: 14 },
  quickAddBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  // Actions
  actionGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actionCard: {
    flex: 1, alignItems: "center", paddingVertical: 20,
    borderRadius: 14, borderWidth: 1, gap: 6,
  },
  actionText: { fontSize: 14, fontWeight: "600" },

  // Expenses
  expenseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  totalBadge: { fontWeight: "700", fontSize: 14 },
  expenseRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  expenseIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", paddingVertical: spacing.md },
  viewMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    marginBottom: spacing.sm,
  },
  viewMoreText: { fontSize: 14, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: spacing.lg,
  },
  modalHeader: { alignItems: "center", marginBottom: spacing.lg },
  modalIcon: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  codeDisplay: {
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  codeText: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 10,
  },
  codeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: spacing.lg,
  },
  codeInfoText: { fontSize: 12 },
  closeModalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});