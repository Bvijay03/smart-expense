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
import { settlementService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import type { Settlement } from "@/shared/types";

type Props = NativeStackScreenProps<RootStackParamList, "Settlements">;

export function SettlementsScreen({ route }: Props) {
  const { groupId, groupName } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Modal state
  const [settleModal, setSettleModal] = useState<Settlement | null>(null);
  const [settleAmount, setSettleAmount] = useState("");

  const balances = useQuery({
    queryKey: ["balances", groupId],
    queryFn: () => settlementService.balances(groupId).then((r) => r.data.data),
  });

  const settlements = useQuery({
    queryKey: ["settlements", groupId],
    queryFn: () => settlementService.list(groupId).then((r) => r.data.data),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
    queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const settleWithAmount = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      settlementService.settleWithAmount(id, amount),
    onSuccess: (res) => {
      invalidateAll();
      setSettleModal(null);
      setSettleAmount("");
      const data = res.data.data;
      if (data.status === "PARTIAL") {
        Alert.alert(
          "Partial Payment",
          `₹${data.paidAmount.toFixed(2)} paid. ₹${Math.abs(data.diff).toFixed(2)} still pending.`,
        );
      } else if (data.status === "OVERPAID") {
        Alert.alert(
          "Overpayment",
          `₹${data.paidAmount.toFixed(2)} paid (₹${data.diff.toFixed(2)} extra). A reverse settlement has been created.`,
        );
      } else {
        Alert.alert("Settled!", "Payment recorded successfully.");
      }
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const openSettleModal = (s: Settlement) => {
    setSettleModal(s);
    setSettleAmount(String(s.amount.toFixed(2)));
  };

  const handleSettle = () => {
    if (!settleModal) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid", "Enter a valid amount");
      return;
    }
    settleWithAmount.mutate({ id: settleModal.id, amount });
  };

  if (balances.isLoading || settlements.isLoading) return <LoadingState />;
  if (balances.isError) {
    return <ErrorState message="Failed to load settlements" onRetry={balances.refetch} />;
  }

  const totalPaid = (balances.data ?? []).reduce((s, b) => s + b.paid, 0);
  const pendingSettlements = (settlements.data ?? []).filter((s) => s.status === "PENDING");
  const settledSettlements = (settlements.data ?? []).filter((s) => s.status === "SETTLED");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Settlements" subtitle={groupName} />

      {/* Summary */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>₹{totalPaid.toFixed(2)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Spent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{balances.data?.length ?? 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Members</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: pendingSettlements.length ? colors.error : colors.success }]}>
              {pendingSettlements.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
        </View>
      </Card>

      {/* Per-person breakdown */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>Per Person</Text>
      {balances.data?.map((b) => {
        const isPositive = b.net >= 0;
        const personOwes = pendingSettlements.filter((s) => s.fromUserId === b.userId);
        const personGets = pendingSettlements.filter((s) => s.toUserId === b.userId);

        return (
          <Card key={b.userId}>
            <View style={styles.personHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {b.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.personName, { color: colors.text }]}>{b.name}</Text>
                <Text style={[styles.personSub, { color: colors.textSecondary }]}>
                  Paid ₹{b.paid.toFixed(2)} · Share ₹{b.owed.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.netBadge, { backgroundColor: isPositive ? colors.success + "22" : colors.error + "22" }]}>
                <Text style={[styles.netText, { color: isPositive ? colors.success : colors.error }]}>
                  {isPositive ? "+" : ""}₹{b.net.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* What this person owes */}
            {personOwes.length > 0 && (
              <View style={[styles.debtContainer, { borderTopColor: colors.border }]}>
                {personOwes.map((s) => (
                  <View key={s.id} style={styles.debtCard}>
                    <View style={styles.debtInfo}>
                      <Ionicons name="arrow-up-circle-outline" size={18} color={colors.error} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.debtText, { color: colors.text }]}>
                          Owes {s.toUser.name}
                        </Text>
                        <Text style={[styles.debtAmount, { color: colors.error }]}>
                          ₹{s.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.settleBtn, { backgroundColor: colors.primary }]}
                      onPress={() => openSettleModal(s)}
                    >
                      <Text style={styles.settleBtnText}>Settle This</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* What this person gets back */}
            {personGets.length > 0 && (
              <View style={[!personOwes.length ? styles.debtContainer : undefined, personOwes.length ? styles.getsSection : undefined, { borderTopColor: colors.border }]}>
                {personGets.map((s) => (
                  <View key={s.id} style={styles.debtInfo}>
                    <Ionicons name="arrow-down-circle-outline" size={18} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.debtText, { color: colors.text }]}>
                        Gets from {s.fromUser.name}
                      </Text>
                      <Text style={[styles.debtAmount, { color: colors.success }]}>
                        ₹{s.amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {personOwes.length === 0 && personGets.length === 0 && (
              <Text style={[styles.allClear, { color: colors.success }]}>✓ All clear</Text>
            )}
          </Card>
        );
      })}

      {/* Settled history */}
      {settledSettlements.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>
            Settlement History
          </Text>
          {settledSettlements.map((s) => (
            <Card key={s.id}>
              <View style={styles.historyRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text }}>
                    {s.fromUser.name} → {s.toUser.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {s.settledAt ? new Date(s.settledAt).toLocaleDateString() : ""}
                  </Text>
                </View>
                <Text style={{ color: colors.success, fontWeight: "700" }}>
                  ₹{s.amount.toFixed(2)}
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}

      {pendingSettlements.length === 0 && settledSettlements.length === 0 && (
        <Card>
          <View style={styles.allSettledRow}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            <Text style={[styles.allSettledText, { color: colors.success }]}>All settled up!</Text>
          </View>
        </Card>
      )}

      {/* Settle Modal */}
      <Modal visible={!!settleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Payment</Text>

            {settleModal && (
              <>
                <View style={[styles.modalInfo, { backgroundColor: colors.background }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {settleModal.fromUser.name} owes {settleModal.toUser.name}
                  </Text>
                  <Text style={[styles.modalOwed, { color: colors.primary }]}>
                    ₹{settleModal.amount.toFixed(2)}
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={settleAmount}
                  onChangeText={setSettleAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />

                {(() => {
                  const paid = parseFloat(settleAmount) || 0;
                  const owed = settleModal.amount;
                  const diff = paid - owed;
                  if (Math.abs(diff) < 0.01) return null;
                  return (
                    <View style={[styles.diffBanner, { backgroundColor: diff < 0 ? colors.error + "15" : colors.success + "15" }]}>
                      <Ionicons
                        name={diff < 0 ? "alert-circle-outline" : "information-circle-outline"}
                        size={16}
                        color={diff < 0 ? colors.error : colors.success}
                      />
                      <Text style={{ color: diff < 0 ? colors.error : colors.success, fontSize: 13, flex: 1 }}>
                        {diff < 0
                          ? `₹${Math.abs(diff).toFixed(2)} will remain pending`
                          : `₹${diff.toFixed(2)} overpaid — a reverse settlement will be created`}
                      </Text>
                    </View>
                  );
                })()}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => { setSettleModal(null); setSettleAmount(""); }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "600" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSettle}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {settleWithAmount.isPending ? "Settling..." : "Confirm Payment"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", marginTop: spacing.xs },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  personHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  personName: { fontSize: 16, fontWeight: "600" },
  personSub: { fontSize: 12, marginTop: 2 },
  netBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  netText: { fontWeight: "700", fontSize: 14 },
  debtContainer: { borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm, gap: 10 },
  getsSection: { marginTop: 8, gap: 6 },
  debtCard: { gap: 6 },
  debtInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  debtText: { fontSize: 14, fontWeight: "500" },
  debtAmount: { fontWeight: "700", fontSize: 15 },
  settleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: "flex-start", marginLeft: 26 },
  settleBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  allClear: { marginTop: spacing.sm, fontSize: 13, fontWeight: "600" },
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  allSettledRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center", paddingVertical: spacing.sm },
  allSettledText: { fontSize: 16, fontWeight: "600" },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
    padding: spacing.md,
  },
  modalCard: { width: "100%", borderRadius: 16, padding: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  modalInfo: { padding: spacing.sm, borderRadius: 10, marginBottom: spacing.md },
  modalOwed: { fontSize: 24, fontWeight: "700", marginTop: 4 },
  inputLabel: { fontSize: 13, marginBottom: 4 },
  modalInput: {
    fontSize: 20, fontWeight: "700",
    borderWidth: 1, borderRadius: 10,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  diffBanner: { flexDirection: "row", gap: 8, alignItems: "center", padding: spacing.sm, borderRadius: 8, marginBottom: spacing.md },
  modalActions: { flexDirection: "row", gap: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
});
