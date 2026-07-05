import { useState } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { groupService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

export function GroupsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupService.list().then((r) => r.data.data),
  });

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
      <View style={styles.headerRow}>
        <ScreenHeader title="Groups" subtitle="Shared expenses with friends" />
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => setJoinModalVisible(true)}
          >
            <Ionicons name="enter-outline" size={18} color={colors.primary} />
            <Text style={[styles.joinBtnText, { color: colors.primary }]}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("CreateGroup")}
          >
            <Ionicons name="add" size={28} color="#fff" />
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
                onPress={() =>
                  navigation.navigate("GroupDetail", {
                    groupId: item.id,
                    groupName: item.name,
                  })
                }
              >
                <Card style={styles.card}>
                  {/* Top row: name + member count */}
                  <View style={styles.cardTop}>
                    <View style={[styles.groupIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name="people" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>
                        {item.members?.length ?? 0} members · {item.expenseCount ?? 0} expenses
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </View>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    {/* Net balance */}
                    <View style={styles.statItem}>
                      <View style={styles.statLabelRow}>
                        <Ionicons name={netIcon} size={14} color={netColor} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Balance
                        </Text>
                      </View>
                      <Text style={[styles.statValue, { color: netColor }]}>
                        {netLabel}
                      </Text>
                    </View>

                    {/* Vertical separator */}
                    <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

                    {/* Contribution */}
                    <View style={styles.statItem}>
                      <View style={styles.statLabelRow}>
                        <Ionicons name="wallet-outline" size={14} color={colors.primary} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Contributed
                        </Text>
                      </View>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        ₹{contribution.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </Card>
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
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: colors.primary + "18" }]}>
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
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase().slice(0, 6))}
                placeholder="A3X7K9"
                placeholderTextColor={colors.textSecondary + "80"}
                autoCapitalize="characters"
                maxLength={6}
                textAlign="center"
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setJoinModalVisible(false); setInviteCode(""); }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    styles.submitBtn,
                    { backgroundColor: inviteCode.length === 6 ? colors.primary : colors.primary + "50" },
                  ]}
                  onPress={handleJoinByCode}
                  disabled={joining || inviteCode.length !== 6}
                >
                  <Text style={styles.submitBtnText}>
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
  container: { flex: 1, padding: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerButtons: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  joinBtnText: { fontSize: 14, fontWeight: "600" },
  fab: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  list: { paddingBottom: spacing.xl },

  // Card
  card: { paddingVertical: spacing.md },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  groupIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: 17, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },

  // Dividers
  divider: { height: 1, marginBottom: spacing.sm },
  verticalDivider: { width: 1, marginHorizontal: spacing.sm },

  // Stats
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1 },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  statLabel: { fontSize: 11, fontWeight: "500" },
  statValue: { fontSize: 14, fontWeight: "700" },

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
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  codeInput: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 8,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  modalButtons: { flexDirection: "row", gap: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  submitBtn: {},
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});