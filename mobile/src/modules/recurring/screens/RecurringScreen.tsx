import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/shared/components/Button";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { ErrorState } from "@/shared/components/ErrorState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { recurringService } from "@/shared/services/modules";
import { getErrorMessage } from "@/shared/services/api";

export function RecurringScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("100");
  const [category, setCategory] = useState("Food");
  const [notes, setNotes] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["recurring"],
    queryFn: () => recurringService.list().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const parsedAmount = Number(amount);
      const parsedDay = Number(dayOfMonth);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid amount");
      }
      if (!dayOfMonth || isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        throw new Error("Day of month must be between 1 and 31");
      }
      return recurringService.create({
        amount: parsedAmount,
        category,
        notes: notes.trim() || undefined,
        dayOfMonth: parsedDay,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      setAmount("100");
      setCategory("Food");
      setNotes("");
      setDayOfMonth("1");
      Alert.alert("Saved", "Recurring expense added.");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => recurringService.toggleActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const summary = useMemo(() => {
    const items = data ?? [];
    return {
      active: items.filter((item: any) => item.isActive).length,
      total: items.length,
    };
  }, [data]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load recurring expenses" onRetry={refetch} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Recurring" subtitle="Auto-create expenses on a schedule" />

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add recurring expense</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={category}
            onChangeText={setCategory}
            placeholder="Category"
          />
        </View>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: spacing.sm }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes"
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={dayOfMonth}
          onChangeText={setDayOfMonth}
          placeholder="Day of month"
          keyboardType="number-pad"
        />
        <View style={styles.actions}>
          <Button
            title="Save"
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
          />
        </View>
      </Card>

      <Card>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: colors.text }]}>Active: {summary.active}</Text>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>Total: {summary.total}</Text>
        </View>
      </Card>

      {(data ?? []).length === 0 ? (
        <Card>
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No recurring expenses yet.</Text>
        </Card>
      ) : (
        (data ?? []).map((item: any) => (
          <Card key={item.id}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>₹{Number(item.amount).toFixed(2)}</Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Category: {item.category}</Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Day: {item.dayOfMonth}</Text>
                {item.notes ? <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Notes: {item.notes}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => toggleMutation.mutate(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={item.isActive ? "toggle" : "toggle-outline"} size={24} color={item.isActive ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Delete", "Remove this recurring expense?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                  ]);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: spacing.sm },
  actions: { marginTop: spacing.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryText: { fontSize: 14, fontWeight: "600" },
  empty: { textAlign: "center" },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemTitle: { fontSize: 16, fontWeight: "700" },
  itemMeta: { fontSize: 12, marginTop: 2 },
});
