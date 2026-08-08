import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { sharedExpenseService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { useAuthStore } from "@/modules/authentication/store/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "SharedExpenseDetail">;

export function SharedExpenseDetailScreen({ route }: Props) {
  const { expenseId, groupId } = route.params;
  const { colors } = useThemeStore();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shared-expense", expenseId],
    queryFn: () => sharedExpenseService.list(groupId).then((r) => {
      const expense = r.data.data.find((e) => e.id === expenseId);
      if (!expense) throw new Error("Expense not found");
      return expense;
    }),
  });

  const deleteExpense = useMutation({
    mutationFn: () => sharedExpenseService.delete(groupId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      Alert.alert("Success", "Transaction deleted");
      navigation.goBack();
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Failed to delete"),
  });

  const confirmDelete = () => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this expense?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExpense.mutate() },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Failed to load expense" onRetry={refetch} />;

  // Group split logic
  const mySplit = data.splits.find((s) => s.userId === user?.id);
  const otherSplits = data.splits.filter((s) => s.userId !== user?.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.ambientGlow} />

      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: "transparent" }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Smart Expense</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Action Header */}
        <View style={styles.actionHeader}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Transaction Details</Text>
          <TouchableOpacity 
            style={[styles.editBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}
            onPress={() => Alert.alert("Coming Soon", "Editing shared expenses is not yet supported.")}
          >
            <Ionicons name="pencil" size={14} color={colors.textSecondary} />
            <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>EDIT</Text>
          </TouchableOpacity>
        </View>

        {/* Receipt Card */}
        <View style={[styles.receiptCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
          {/* Top Info */}
          <View style={[styles.receiptTop, { borderBottomColor: colors.border }]}>
            <View style={styles.receiptTopLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "33" }]}>
                <Ionicons name="restaurant" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.receiptTitle, { color: colors.text }]}>{data.description}</Text>
                <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>
                  {new Date(data.expenseDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.receiptTopRight}>
              <Text style={[styles.receiptAmount, { color: colors.primary }]}>
                ₹{data.amount.toFixed(2)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + "33" }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.gridCol}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>PAID BY</Text>
              <View style={[styles.paidByBox, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: colors.border }]}>
                <View style={[styles.avatarBox, { borderColor: colors.primary + "4D" }]}>
                  {data.paidBy.avatarUrl ? (
                    <Image source={{ uri: data.paidBy.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <Text style={{ color: colors.text, fontWeight: "700" }}>{data.paidBy.name.charAt(0)}</Text>
                  )}
                </View>
                <View>
                  <Text style={[styles.paidByName, { color: colors.text }]}>
                    {data.paidBy.id === user?.id ? "You" : data.paidBy.name}
                  </Text>
                  <Text style={[styles.paidBySub, { color: colors.primary + "B3" }]}>Shared Expense</Text>
                </View>
              </View>
            </View>

            <View style={styles.gridCol}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
              <View style={styles.categoryTags}>
                <View style={[styles.tag, { borderColor: colors.primary + "4D" }]}>
                  <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.tagText, { color: colors.text }]}>{data.category}</Text>
                </View>
                <View style={[styles.tag, { borderColor: colors.border }]}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{data.splitType}</Text>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* Split Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Split Breakdown</Text>
        <View style={styles.splitList}>
          
          {/* User's own split */}
          {mySplit && (
            <View style={[styles.splitItem, { borderLeftColor: colors.primary, borderLeftWidth: 2 }]}>
              <View style={styles.splitLeft}>
                <View style={[styles.splitAvatar, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{user?.name?.charAt(0)}</Text>
                </View>
                <Text style={[styles.splitName, { color: colors.text }]}>You</Text>
              </View>
              <View style={styles.splitRight}>
                <Text style={[styles.splitAmount, { color: colors.primary }]}>₹{mySplit.amountOwed.toFixed(2)}</Text>
                <Text style={[styles.splitPercent, { color: colors.textSecondary }]}>
                  {((mySplit.amountOwed / data.amount) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          )}

          {/* Other members */}
          {otherSplits.map((split) => {
            const isPayer = data.paidBy.id === split.userId;
            const youArePayer = data.paidBy.id === user?.id;
            
            return (
              <View key={split.userId} style={styles.splitItem}>
                <View style={styles.splitLeft}>
                  <View style={[styles.splitAvatar, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>{split.user.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.splitName, { color: colors.text }]}>{split.user.name}</Text>
                    <Text style={[styles.splitSub, { color: youArePayer ? colors.error : isPayer ? colors.primary : colors.textSecondary }]}>
                      {isPayer ? "Paid" : youArePayer ? "Owes you" : "Owes"}
                    </Text>
                  </View>
                </View>
                <View style={styles.splitRight}>
                  <Text style={[styles.splitAmount, { color: colors.text }]}>₹{split.amountOwed.toFixed(2)}</Text>
                  <Text style={[styles.splitPercent, { color: colors.textSecondary }]}>
                    {((split.amountOwed / data.amount) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delete Button */}
        <TouchableOpacity 
          style={[styles.deleteBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.error + "4D" }]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash" size={20} color={colors.error} />
          <Text style={[styles.deleteText, { color: colors.error }]}>DELETE TRANSACTION</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative" },
  ambientGlow: { position: "absolute", top: "20%", left: "50%", transform: [{ translateX: -150 }, { translateY: -150 }], width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(0,245,255,0.1)", zIndex: 0 },
  
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 64, paddingHorizontal: spacing.md, zIndex: 50 },
  appBarBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  appBarTitle: { fontSize: 28, fontWeight: "700", fontFamily: "Hanken Grotesk", textShadowColor: "rgba(0, 245, 255, 0.5)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },

  content: { paddingHorizontal: spacing.md, paddingBottom: 100, zIndex: 10 },

  actionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: spacing.md },
  actionTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24, borderWidth: 1 },
  editBtnText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 1 },

  receiptCard: { borderRadius: 16, borderWidth: 1, padding: spacing.md, overflow: "hidden" },
  receiptTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: spacing.md, borderBottomWidth: 1, marginBottom: spacing.md },
  receiptTopLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  receiptTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  receiptDate: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 4 },
  receiptTopRight: { alignItems: "flex-end" },
  receiptAmount: { fontSize: 32, fontFamily: "Hanken Grotesk", fontWeight: "700", textShadowColor: "rgba(0, 245, 255, 0.5)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8 },
  statusText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  detailsGrid: { gap: spacing.md },
  gridCol: { gap: spacing.xs },
  gridLabel: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 1 },
  paidByBox: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 8, borderWidth: 1 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  paidByName: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  paidBySub: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 2 },

  categoryTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  sectionTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500", marginTop: spacing.lg, marginBottom: spacing.sm },

  splitList: { gap: spacing.xs },
  splitItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)" },
  splitLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  splitAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  splitName: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  splitSub: { fontSize: 10, fontFamily: "JetBrains Mono" },
  splitRight: { alignItems: "flex-end" },
  splitAmount: { fontSize: 14, fontFamily: "JetBrains Mono" },
  splitPercent: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 1, marginTop: 2 },

  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, marginTop: spacing.xl, alignSelf: "center", paddingHorizontal: spacing.xl },
  deleteText: { fontSize: 14, fontFamily: "JetBrains Mono", letterSpacing: 1 },
});
