import React, { useState, useCallback } from "react";
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
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { settlementService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { getErrorMessage } from "@/shared/services/api";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import type { Settlement } from "@/shared/types";

type Props = NativeStackScreenProps<RootStackParamList, "Settlements">;

export function SettlementsScreen({ route }: Props) {
  const { groupId, groupName } = route.params;
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

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

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([balances.refetch(), settlements.refetch()]);
    setRefreshing(false);
  }, [balances, settlements]);

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

  const allSettlements = settlements.data ?? [];
  const pendingSettlements = allSettlements.filter((s) => s.status === "PENDING");
  
  // Calculate current user's net balance
  let userNetBalance = 0;
  pendingSettlements.forEach((s) => {
    if (s.toUserId === user?.id) userNetBalance += s.amount;
    else if (s.fromUserId === user?.id) userNetBalance -= s.amount;
  });

  const balanceColor = userNetBalance > 0 ? colors.success : userNetBalance < 0 ? "#ffb1c4" : colors.text;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Settle Up</Text>
        <View style={styles.appBarBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Summary Header */}
        <View style={[styles.summaryPanel, { borderColor: colors.border }]}>
          <View style={styles.gradientOverlay} />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Balance</Text>
          <Text 
            style={[
              styles.summaryValue, 
              { color: balanceColor },
              userNetBalance < 0 && styles.neonTextPink,
              userNetBalance > 0 && styles.neonTextGreen
            ]}
          >
            {userNetBalance < 0 ? "-" : userNetBalance > 0 ? "+" : ""}₹{Math.abs(userNetBalance).toFixed(2)}
          </Text>
          <TouchableOpacity 
            style={[styles.settleAllBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={() => {
              // Just a stub for "Settle All" since we only have single settle API rn
              Alert.alert("Info", "Select individual debts to settle them.");
            }}
          >
            <Text style={[styles.settleAllText, { color: colors.background }]}>Settle All Debts</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Balances</Text>

        <View style={styles.list}>
          {allSettlements.map((s) => {
            const isSettled = s.status === "SETTLED";
            const iOwe = s.fromUserId === user?.id;
            const owesMe = s.toUserId === user?.id;
            
            // If the user isn't involved in this settlement directly, we can still show it but from a 3rd party perspective
            const fromName = iOwe ? "You" : s.fromUser.name;
            const toName = owesMe ? "You" : s.toUser.name;
            const displayTitle = iOwe ? s.toUser.name : owesMe ? s.fromUser.name : `${fromName} to ${toName}`;
            const displaySub = iOwe ? "You owe them" : owesMe ? "Owes you" : `${fromName} owes ${toName}`;
            
            return (
              <View 
                key={s.id} 
                style={[
                  styles.debtCard, 
                  { borderColor: colors.border },
                  isSettled && { opacity: 0.6 }
                ]}
              >
                <View style={styles.debtLeft}>
                  <View style={[styles.avatar, { borderColor: "rgba(255,255,255,0.2)" }]}>
                    {s.toUser.avatarUrl || s.fromUser.avatarUrl ? (
                      <Image source={{ uri: iOwe ? s.toUser.avatarUrl : s.fromUser.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>
                          {displayTitle.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={[styles.debtTitle, { color: colors.text }]}>{displayTitle}</Text>
                    <Text style={[styles.debtSub, { color: colors.textSecondary }]}>
                      {isSettled ? "Settled up" : displaySub}
                    </Text>
                  </View>
                </View>

                <View style={styles.debtRight}>
                  {isSettled ? (
                    <>
                      <Text style={[styles.debtAmount, { color: colors.textSecondary }]}>
                        ₹{s.amount.toFixed(2)}
                      </Text>
                      <Ionicons name="checkmark-circle" size={20} color={colors.textSecondary} style={{ marginTop: 4 }} />
                    </>
                  ) : (
                    <>
                      <Text 
                        style={[
                          styles.debtAmount, 
                          iOwe ? [styles.neonTextPink, { color: "#ffb1c4" }] : 
                          owesMe ? [styles.neonTextGreen, { color: colors.success }] : 
                          { color: colors.text }
                        ]}
                      >
                        {owesMe ? "+" : iOwe ? "-" : ""}₹{s.amount.toFixed(2)}
                      </Text>
                      
                      {iOwe ? (
                        <TouchableOpacity 
                          style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "#ffb1c44D" }]}
                          onPress={() => openSettleModal(s)}
                        >
                          <Text style={[styles.actionBtnText, { color: "#ffb1c4" }]}>Pay</Text>
                          <MaterialIcons name="payment" size={16} color="#ffb1c4" />
                        </TouchableOpacity>
                      ) : owesMe ? (
                        <TouchableOpacity 
                          style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border, opacity: 0.5 }]}
                          disabled
                        >
                          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Remind</Text>
                          <Ionicons name="notifications" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ) : null}
                    </>
                  )}
                </View>
              </View>
            );
          })}

          {allSettlements.length === 0 && (
            <View style={{ alignItems: "center", padding: spacing.xl }}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: 18, marginTop: 16 }}>All settled up!</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Settle Modal (Kept functionality but reskinned slightly) */}
      <Modal visible={!!settleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Payment</Text>

            {settleModal && (
              <>
                <View style={[styles.modalInfo, { backgroundColor: "rgba(255,255,255,0.03)" }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: "Hanken Grotesk" }}>
                    You owe {settleModal.toUser.name}
                  </Text>
                  <Text style={[styles.modalOwed, { color: "#ffb1c4" }, styles.neonTextPink]}>
                    ₹{settleModal.amount.toFixed(2)}
                  </Text>
                </View>

                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderBottomColor: colors.border }]}
                  value={settleAmount}
                  onChangeText={setSettleAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}
                    onPress={() => { setSettleModal(null); setSettleAmount(""); }}
                  >
                    <Text style={{ color: colors.text, fontFamily: "JetBrains Mono" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.primary, borderWidth: 0 }]}
                    onPress={handleSettle}
                  >
                    <Text style={{ color: colors.background, fontFamily: "JetBrains Mono", fontWeight: "700" }}>
                      {settleWithAmount.isPending ? "Settling..." : "Confirm"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 64, paddingHorizontal: spacing.md, borderBottomWidth: 1, zIndex: 50 },
  appBarBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  appBarTitle: { fontSize: 22, fontWeight: "700" },

  content: { padding: spacing.md, paddingBottom: 100 },

  summaryPanel: { alignItems: "center", justifyContent: "center", gap: 8, padding: spacing.md, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" },
  gradientOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,245,255,0.05)" },
  summaryLabel: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500", zIndex: 10 },
  summaryValue: { fontSize: 48, fontFamily: "Hanken Grotesk", fontWeight: "700", zIndex: 10, letterSpacing: -1 },
  settleAllBtn: { marginTop: spacing.sm, paddingVertical: 8, paddingHorizontal: 40, borderRadius: 24, zIndex: 10, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 5 },
  settleAllText: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },

  sectionTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500", marginTop: spacing.md, marginBottom: spacing.sm },

  list: { gap: spacing.sm },
  debtCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.sm, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  debtLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 20, fontWeight: "700" },
  debtTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  debtSub: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  
  debtRight: { alignItems: "flex-end", gap: 8 },
  debtAmount: { fontSize: 18, fontFamily: "JetBrains Mono", letterSpacing: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  neonTextPink: { textShadowColor: "rgba(255, 177, 196, 0.5)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  neonTextGreen: { textShadowColor: "rgba(47, 248, 1, 0.5)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: spacing.md },
  modalCard: { width: "100%", borderRadius: 16, padding: spacing.md, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Hanken Grotesk", marginBottom: spacing.md },
  modalInfo: { padding: spacing.sm, borderRadius: 12, marginBottom: spacing.md, alignItems: "center" },
  modalOwed: { fontSize: 28, fontWeight: "700", fontFamily: "JetBrains Mono", marginTop: 4 },
  modalInput: { fontSize: 24, fontWeight: "700", fontFamily: "JetBrains Mono", borderBottomWidth: 2, padding: spacing.sm, marginBottom: spacing.lg, textAlign: "center" },
  modalActions: { flexDirection: "row", gap: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1 },
});
