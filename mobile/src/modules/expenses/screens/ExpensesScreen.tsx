import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { expenseService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { getErrorMessage } from "@/shared/services/api";

export function ExpensesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expenseService.list().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmDelete = (id: string) => {
    Alert.alert("Delete expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load expenses" onRetry={refetch} />;

  const items = data?.items ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <ScreenHeader title="Expenses" subtitle="Track personal spending" />
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("AddExpense")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          message="Tap + to add your first expense"
          icon="receipt-outline"
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.category, { color: colors.text }]}>
                    {item.category}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {new Date(item.expenseDate).toLocaleDateString()}
                  </Text>
                  {item.notes ? (
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.amount, { color: colors.primary }]}>
                  ₹{item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("EditExpense", {
                    expenseId: item.id,
                    amount: item.amount,
                    category: item.category,
                    expenseDate: item.expenseDate,
                    notes: item.notes,
                  })}
                  style={{ marginRight: 4 }}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  list: { paddingBottom: spacing.xl },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  category: { fontSize: 16, fontWeight: "600" },
  amount: { fontSize: 16, fontWeight: "700" },
});
