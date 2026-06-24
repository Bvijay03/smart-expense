import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Settlements" subtitle={groupName} />

      <Text style={[styles.section, { color: colors.text }]}>Balances</Text>
      {balances.data?.map((b) => (
        <Card key={b.userId}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{b.name}</Text>
          <Text style={{ color: colors.textSecondary }}>
            Paid ₹{b.paid.toFixed(2)} · Owed ₹{b.owed.toFixed(2)}
          </Text>
          <Text
            style={{
              color: b.net >= 0 ? colors.success : colors.error,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            Net: {b.net >= 0 ? "+" : ""}₹{b.net.toFixed(2)}
          </Text>
        </Card>
      ))}

      <Text style={[styles.section, { color: colors.text, marginTop: spacing.md }]}>
        Suggested Settlements
      </Text>
      {settlements.data?.length ? (
        settlements.data.map((s) => (
          <Card key={s.id}>
            <Text style={{ color: colors.text }}>
              {s.fromUser.name} owes {s.toUser.name}
            </Text>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }}>
              ₹{s.amount.toFixed(2)}
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
              Status: {s.status}
            </Text>
            {s.status === "PENDING" ? (
              <Button
                title="Mark as Settled"
                variant="secondary"
                onPress={() => markSettled.mutate(s.id)}
              />
            ) : null}
          </Card>
        ))
      ) : (
        <Text style={{ color: colors.textSecondary }}>All settled up!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  section: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
});
