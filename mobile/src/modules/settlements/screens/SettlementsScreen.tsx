import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
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

type Props = NativeStackScreenProps<RootStackParamList, "Settlements">;

export function SettlementsScreen({ route }: Props) {
  const { groupId, groupName } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const balances = useQuery({
    queryKey: ["balances", groupId],
    queryFn: () => settlementService.balances(groupId).then((r) => r.data.data),
  });

  const settlements = useQuery({
    queryKey: ["settlements", groupId],
    queryFn: () => settlementService.list(groupId).then((r) => r.data.data),
  });

  const markSettled = useMutation({
    mutationFn: settlementService.markSettled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  if (balances.isLoading || settlements.isLoading) return <LoadingState />;
  if (balances.isError) {
    return <ErrorState message="Failed to load settlements" onRetry={balances.refetch} />;
  }

  const totalPaid = (balances.data ?? []).reduce((s, b) => s + b.paid, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Settlements" subtitle={groupName} />

      {/* Summary bar */}
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
            <Text style={[styles.summaryValue, { color: settlements.data?.filter(s => s.status === "PENDING").length ? colors.error : colors.success }]}>
              {settlements.data?.filter(s => s.status === "PENDING").length ?? 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
        </View>
      </Card>

      {/* Per-person breakdown */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>Per Person</Text>
      {balances.data?.map((b) => {
        const isPositive = b.net >= 0;
        // Find what this person owes to / is owed by others
        const personDebts = (settlements.data ?? []).filter(
          (s) => s.status === "PENDING" && (s.fromUserId === b.userId || s.toUserId === b.userId)
        );
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
                  Paid ₹{b.paid.toFixed(2)} · Owes ₹{b.owed.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.netBadge, { backgroundColor: isPositive ? colors.success + "22" : colors.error + "22" }]}>
                <Text style={[styles.netText, { color: isPositive ? colors.success : colors.error }]}>
                  {isPositive ? "+" : ""}₹{b.net.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Individual debts */}
            {personDebts.length > 0 && (
              <View style={[styles.debtContainer, { borderTopColor: colors.border }]}>
                {personDebts.map((s) => {
                  const owes = s.fromUserId === b.userId;
                  return (
                    <View key={s.id} style={styles.debtRow}>
                      <Ionicons
                        name={owes ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                        size={16}
                        color={owes ? colors.error : colors.success}
                      />
                      <Text style={[styles.debtText, { color: colors.textSecondary }]}>
                        {owes
                          ? `Owes ${s.toUser.name}`
                          : `Gets from ${s.fromUser.name}`}
                      </Text>
                      <Text style={[styles.debtAmount, { color: owes ? colors.error : colors.success }]}>
                        ₹{s.amount.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        );
      })}

      {/* Suggested settlements */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>
        Suggested Settlements
      </Text>
      {settlements.data?.length ? (
        settlements.data.map((s) => (
          <Card key={s.id}>
            <View style={styles.settlementRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {s.fromUser.name} → {s.toUser.name}
                </Text>
                <Text style={[{ color: colors.primary, fontWeight: "700", fontSize: 18, marginTop: 2 }]}>
                  ₹{s.amount.toFixed(2)}
                </Text>
              </View>
              {s.status === "PENDING" ? (
                <Button
                  title="Settled ✓"
                  variant="secondary"
                  onPress={() => markSettled.mutate(s.id)}
                />
              ) : (
                <View style={[styles.settledBadge, { backgroundColor: colors.success + "22" }]}>
                  <Text style={{ color: colors.success, fontWeight: "600", fontSize: 12 }}>✓ Settled</Text>
                </View>
              )}
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <View style={styles.allSettledRow}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            <Text style={[styles.allSettledText, { color: colors.success }]}>All settled up!</Text>
          </View>
        </Card>
      )}
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
  debtContainer: { borderTopWidth: 1, marginTop: spacing.sm, paddingTop: spacing.sm, gap: 6 },
  debtRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  debtText: { flex: 1, fontSize: 13 },
  debtAmount: { fontWeight: "600", fontSize: 13 },
  settlementRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  settledBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  allSettledRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center", paddingVertical: spacing.sm },
  allSettledText: { fontSize: 16, fontWeight: "600" },
});


