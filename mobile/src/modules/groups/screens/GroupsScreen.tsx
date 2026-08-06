import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { groupService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

export function GroupsScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupService.list().then((r) => r.data.data),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleJoinByCode = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-character invite code.");
      return;
    }
    setJoining(true);
    try {
      const res = await groupService.joinByCode(code);
      const result = res.data.data;
      setJoinModalVisible(false);
      setInviteCode("");
      Alert.alert(
        "Request Sent!",
        `Your request to join "${result.groupName}" has been sent. The admin will review it shortly.`
      );
      refetch();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        "Failed to join group. Please check the code and try again.";
      Alert.alert("Error", msg);
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load groups" onRetry={refetch} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Mesh Background Blobs (Optional for main screens, but adds premium feel) */}
      <View style={[styles.bgBlobTop, { backgroundColor: colors.primary + "0A" }]} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: colors.primary }]}>Groups</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>SHARED EXPENSES WITH FRIENDS</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}
            onPress={() => setJoinModalVisible(true)}
          >
            <Ionicons name="enter-outline" size={18} color={colors.text} />
            <Text style={[styles.joinBtnText, { color: colors.text }]}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={() => navigation.navigate("CreateGroup")}
          >
            <Ionicons name="add" size={24} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {!data?.length ? (
        <EmptyState
          title="No groups yet"
          message="Create a group to split bills"
          icon="people-outline"
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const net = item.userNetBalance ?? 0;
            const contribution = item.userContribution ?? 0;
            const isPositive = net > 0;
            const isNeutral = net === 0;
            const netColor = isNeutral
              ? colors.textSecondary
              : isPositive
                ? colors.success
                : colors.error;
            const netLabel = isNeutral
              ? "Settled up"
              : isPositive
                ? `You get ₹${net.toFixed(2)}`
                : `You owe ₹${Math.abs(net).toFixed(2)}`;
            const netIcon = isNeutral
              ? "checkmark-circle-outline"
              : isPositive
                ? "arrow-down-circle-outline"
                : "arrow-up-circle-outline";

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate("GroupDetail", {
                    groupId: item.id,
                    groupName: item.name,
                  })
                }
              >
                <View style={[styles.glassCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
                  {/* Top row: name + member count */}
                  <View style={styles.cardTop}>
                    <View style={[styles.groupIcon, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "33" }]}>
                      <Ionicons name="people" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>
                        {item.members?.length ?? 0} MEMBERS · {item.expenseCount ?? 0} EXPENSES
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </View>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    {/* Net balance */}
                    <View style={styles.statItem}>
                      <View style={styles.statLabelRow}>
                        <Ionicons name={netIcon} size={14} color={netColor} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          BALANCE
                        </Text>
                      </View>
                      <Text style={[styles.statValue, { color: netColor }]}>
                        {netLabel}
                      </Text>
                    </View>

                    {/* Vertical separator */}
                    <View style={[styles.verticalDivider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />

                    {/* Contribution */}
                    <View style={styles.statItem}>
                      <View style={styles.statLabelRow}>
                        <Ionicons name="wallet-outline" size={14} color={colors.primary} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          CONTRIBUTED
                        </Text>
                      </View>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        ₹{contribution.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Join Group Modal ──────────────────────────────────── */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setJoinModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: "100%", alignItems: "center" }}>
            <View style={[styles.modalContent, { backgroundColor: "#1e2024", borderColor: "rgba(255,255,255,0.15)" }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "4D" }]}>
                  <Ionicons name="key-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Join a Group</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Enter the 6-character invite code shared by the group admin
                </Text>
              </View>

              <TextInput
                style={[
                  styles.codeInput,
                  {
                    color: colors.primary,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.15)",
                  },
                ]}
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase().slice(0, 6))}
                placeholder="A3X7K9"
                placeholderTextColor={colors.textSecondary + "50"}
                autoCapitalize="characters"
                maxLength={6}
                textAlign="center"
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn, { borderColor: "rgba(255,255,255,0.2)" }]}
                  onPress={() => { setJoinModalVisible(false); setInviteCode(""); }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    styles.submitBtn,
                    { backgroundColor: inviteCode.length === 6 ? colors.primary : colors.surfaceVariant },
                  ]}
                  onPress={handleJoinByCode}
                  disabled={joining || inviteCode.length !== 6}
                >
                  <Text style={[styles.submitBtnText, { color: inviteCode.length === 6 ? colors.onPrimary : colors.textSecondary }]}>
                    {joining ? "Sending..." : "Send Request"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.xl },
  bgBlobTop: { position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: 150, filter: "blur(60px)" },

  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.lg, zIndex: 10 },
  screenTitle: { fontSize: 32, fontFamily: "Hanken Grotesk", fontWeight: "700", letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 11, fontFamily: "JetBrains Mono", opacity: 0.8, letterSpacing: 1, marginTop: 4 },
  
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 12 },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  joinBtnText: { fontSize: 13, fontFamily: "Hanken Grotesk", fontWeight: "600" },
  fab: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  
  list: { paddingBottom: 120 }, // Extra padding for bottom tabs

  // Glass Card
  glassCard: { 
    padding: spacing.md, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: spacing.sm,
    shadowColor: "#000", shadowOffset: { width:0, height:8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  groupIcon: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: 18, fontFamily: "Hanken Grotesk", fontWeight: "700" },
  meta: { fontSize: 11, fontFamily: "JetBrains Mono", marginTop: 4 },

  // Dividers
  divider: { height: 1, marginBottom: spacing.sm },
  verticalDivider: { width: 1, marginHorizontal: spacing.sm },

  // Stats
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1 },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  statLabel: { fontSize: 10, fontFamily: "JetBrains Mono" },
  statValue: { fontSize: 15, fontFamily: "Hanken Grotesk", fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: "#000", shadowOffset: { width:0, height:20 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 20
  },
  modalHeader: { alignItems: "center", marginBottom: spacing.lg },
  modalIcon: {
    width: 64, height: 64, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 22, fontFamily: "Hanken Grotesk", fontWeight: "700", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, fontFamily: "Hanken Grotesk", textAlign: "center", lineHeight: 18, opacity: 0.8 },
  codeInput: {
    fontSize: 32,
    fontFamily: "JetBrains Mono",
    letterSpacing: 12,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  modalButtons: { flexDirection: "row", gap: spacing.md },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontFamily: "Hanken Grotesk", fontWeight: "600" },
  submitBtn: {},
  submitBtnText: { fontSize: 15, fontFamily: "Hanken Grotesk", fontWeight: "700" },
});