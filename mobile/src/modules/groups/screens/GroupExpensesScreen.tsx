import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { expenseService, sharedExpenseService } from "@/shared/services/modules";
import { Card } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GroupExpenses">;

export function GroupExpensesScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const expenses = useQuery({
    queryKey: ["shared-expenses", groupId],
    queryFn: () => sharedExpenseService.list(groupId).then((r) => r.data.data),
  });

  const deleteExpense = useMutation({
    mutationFn: (expenseId: string) => sharedExpenseService.delete(groupId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmDelete = (expenseId: string, description: string) => {
    Alert.alert("Delete Expense", `Delete "${description}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteExpense.mutate(expenseId),
      },
    ]);
  };

  if (expenses.isLoading) return <LoadingState />;
  if (expenses.isError) return <ErrorState message="Failed to load expenses" onRetry={expenses.refetch} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>All Expenses</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{groupName}</Text>
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={async () => {
            try {
              const res = await expenseService.exportCsv(groupId);
              const csv = res.data;
              const fileName = `group-expenses-${groupName.replace(/\s+/g, "-").toLowerCase()}.csv`;
              const fileUri = `${(FileSystem as any).documentDirectory ?? ""}${fileName}`;
              await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
              await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export group expenses" });
            } catch (err) {
              Alert.alert("Export failed", getErrorMessage(err));
            }
          }}
        >
          <Ionicons name="download-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses.data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No expenses yet</Text>
            </View>
          </Card>
        }
        renderItem={({ item: exp }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("SharedExpenseDetail", {
                expenseId: exp.id,
                groupId,
              })
            }
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
                  onPress={() => confirmDelete(exp.id, exp.description)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error ?? "#ef4444"} />
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { alignItems: "center", paddingVertical: spacing.md },
});
