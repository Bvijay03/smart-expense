import { useState } from "react";
import {
  Alert,
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
import { Button } from "@/shared/components/Button";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GroupDetail">;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [quickName, setQuickName] = useState("");

  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupService.get(groupId).then((r) => r.data.data),
  });

  const expenses = useQuery({
    queryKey: ["shared-expenses", groupId],
    queryFn: () => sharedExpenseService.list(groupId).then((r) => r.data.data),
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

  if (group.isLoading) return <LoadingState />;
  if (group.isError) return <ErrorState message="Failed to load group" onRetry={group.refetch} />;

  const members = group.data?.members?.map((m) => ({ id: m.user.id, name: m.user.name })) ?? [];
  const totalExpenses = expenses.data?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

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

      {/* ── Member avatars ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Members ({members.length})
      </Text>
      <View style={styles.memberGrid}>
        {group.data?.members?.map((m) => (
          <View key={m.id} style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                {m.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
              {m.user.name}
            </Text>
            <Text style={[styles.memberRole, { color: m.role === "ADMIN" ? colors.primary : colors.textSecondary }]}>
              {m.role === "ADMIN" ? "Admin" : "Member"}
            </Text>
          </View>
        ))}
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

      {/* ── Expenses list ── */}
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
        expenses.data.map((exp) => (
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
        ))
      ) : (
        <Card>
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No expenses yet</Text>
          </View>
        </Card>
      )}
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

  // Section
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },

  // Members
  memberGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  memberCard: {
    alignItems: "center", paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1, minWidth: 80, flex: 1, maxWidth: "30%",
  },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  memberAvatarText: { fontSize: 18, fontWeight: "700" },
  memberName: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  memberRole: { fontSize: 11, marginTop: 2 },

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
});
