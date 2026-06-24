import { useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
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
import { Card, ScreenHeader } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
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
  const [memberName, setMemberName] = useState("");
  const [email, setEmail] = useState("");

  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupService.get(groupId).then((r) => r.data.data),
  });

  const expenses = useQuery({
    queryKey: ["shared-expenses", groupId],
    queryFn: () => sharedExpenseService.list(groupId).then((r) => r.data.data),
  });

  const addMember = useMutation({
    mutationFn: ({ name, email }: { name: string; email?: string }) =>
      groupService.addMember(groupId, name, email || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      setMemberName("");
      setEmail("");
      Alert.alert("Success", "Member added");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => groupService.removeMember(groupId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group", groupId] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert("Remove Member", `Remove ${memberName} from group?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeMember.mutate(memberId) },
    ]);
  };

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
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${groupName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteGroup.mutate() },
      ]
    );
  };

  const confirmDeleteExpense = (expenseId: string, description: string) => {
    Alert.alert(
      "Delete Expense",
      `Delete "${description}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteExpense.mutate(expenseId) },
      ]
    );
  };

  if (group.isLoading) return <LoadingState />;
  if (group.isError) {
    return <ErrorState message="Failed to load group" onRetry={group.refetch} />;
  }

  const members =
    group.data?.members?.map((m) => ({
      id: m.user.id,
      name: m.user.name,
    })) ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <ScreenHeader title={groupName} subtitle={group.data?.description ?? ""} />
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate("EditGroup", {
              groupId,
              name: group.data?.name ?? groupName,
              description: group.data?.description ?? null,
            })}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.error ?? "#ef4444" }]}
            onPress={confirmDeleteGroup}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Card>
        <Text style={[styles.section, { color: colors.text }]}>Members</Text>
        {group.data?.members?.map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <Text style={{ color: colors.textSecondary, flex: 1 }}>
              {m.user.name} <Text style={{ color: colors.primary }}>({m.role})</Text>
            </Text>
            {m.role !== "ADMIN" && (
              <TouchableOpacity
                onPress={() => confirmRemoveMember(m.user.id, m.user.name)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.error ?? "#ef4444"} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <Input
          label="Name *"
          value={memberName}
          onChangeText={setMemberName}
          placeholder="Enter member name"
        />
        <Input
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter email if registered"
        />
        <Button
          title="Add Member"
          variant="secondary"
          onPress={() =>
            memberName.trim() &&
            addMember.mutate({ name: memberName.trim(), email: email.trim() || undefined })
          }
        />
      </Card>

      <View style={styles.actions}>
        <Button
          title="Add Shared Expense"
          onPress={() =>
            navigation.navigate("AddSharedExpense", { groupId, members })
          }
        />
        <Button
          title="View Settlements"
          variant="secondary"
          onPress={() =>
            navigation.navigate("Settlements", { groupId, groupName })
          }
        />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Shared Expenses</Text>
      {expenses.data?.length ? (
        expenses.data.map((exp) => (
          <TouchableOpacity
            key={exp.id}
            onPress={() => navigation.navigate("SharedExpenseDetail", { expenseId: exp.id, groupId })}
          >
            <Card>
              <View style={styles.expenseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    {exp.description}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Paid by {exp.paidBy.name} · {exp.splitType}
                  </Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: "700", marginRight: 8 }}>
                  ₹{exp.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); confirmDeleteExpense(exp.id, exp.description); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error ?? "#ef4444"} />
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ color: colors.textSecondary }}>No shared expenses yet</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  section: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  actions: { gap: spacing.sm, marginVertical: spacing.md },
  expenseRow: { flexDirection: "row", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.sm },
  headerActions: { flexDirection: "row", gap: 8, marginTop: spacing.sm },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  memberRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  deleteGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  deleteGroupText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
