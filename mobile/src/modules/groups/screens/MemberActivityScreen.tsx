import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { sharedExpenseService, settlementService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { Card } from "@/shared/components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "MemberActivity">;

type ActivityItem = {
  id: string;
  type: "EXPENSE" | "SETTLEMENT";
  title: string;
  subtitle: string;
  amount: number;
  date: Date;
  isPositive: boolean; // For expenses: did they pay? For settlements: did they receive?
  isNeutral?: boolean; // E.g. they were part of it but their net impact is handled differently, or just display value
};

export function MemberActivityScreen({ route, navigation }: Props) {
  const { groupId, groupName, memberId, memberName } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const expensesQuery = useQuery({
    queryKey: ["shared-expenses", groupId],
    queryFn: () => sharedExpenseService.list(groupId).then((r) => r.data.data),
  });

  const settlementsQuery = useQuery({
    queryKey: ["settlements", groupId],
    queryFn: () => settlementService.list(groupId).then((r) => r.data.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([expensesQuery.refetch(), settlementsQuery.refetch()]);
    setRefreshing(false);
  };

  const activities = useMemo(() => {
    if (!expensesQuery.data || !settlementsQuery.data) return [];
    
    const items: ActivityItem[] = [];

    // Filter and map expenses
    expensesQuery.data.forEach((exp) => {
      const isPayer = exp.paidBy.id === memberId;
      const split = exp.splits.find((s) => s.userId === memberId);
      
      if (isPayer || split) {
        let title = exp.description;
        let subtitle = "";
        let amount = 0;
        let isPositive = false;

        if (isPayer && split) {
          // They paid, and they are in the split
          amount = exp.amount - split.amountOwed;
          subtitle = `Paid ₹${exp.amount.toFixed(2)} (lent ₹${amount.toFixed(2)})`;
          isPositive = true;
        } else if (isPayer && !split) {
          // They paid, but are not in the split (e.g. paying for someone else entirely)
          amount = exp.amount;
          subtitle = `Paid ₹${exp.amount.toFixed(2)} for others`;
          isPositive = true;
        } else if (!isPayer && split) {
          // They didn't pay, but owe money
          amount = split.amountOwed;
          subtitle = `Borrowed from ${exp.paidBy.name}`;
          isPositive = false;
        }

        items.push({
          id: exp.id,
          type: "EXPENSE",
          title,
          subtitle,
          amount,
          date: new Date(exp.expenseDate),
          isPositive,
        });
      }
    });

    // Filter and map settlements
    settlementsQuery.data.forEach((settle) => {
      const isSender = settle.fromUserId === memberId;
      const isReceiver = settle.toUserId === memberId;

      if (isSender || isReceiver) {
        items.push({
          id: settle.id,
          type: "SETTLEMENT",
          title: "Settlement",
          subtitle: isSender ? `Paid to ${settle.toUser.name}` : `Received from ${settle.fromUser.name}`,
          amount: settle.amount,
          date: new Date(settle.settledAt || new Date()),
          isPositive: isReceiver,
        });
      }
    });

    let result = items;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q));
    }
    
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) result = result.filter(i => i.amount >= min);
    }
    
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) result = result.filter(i => i.amount <= max);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) result = result.filter(i => i.date >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (!isNaN(end.getTime())) result = result.filter(i => i.date <= end);
    }

    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expensesQuery.data, settlementsQuery.data, memberId, searchQuery, minAmount, maxAmount, startDate, endDate]);

  if (expensesQuery.isLoading || settlementsQuery.isLoading) return <LoadingState />;
  if (expensesQuery.isError || settlementsQuery.isError) return <ErrorState message="Failed to load activity" onRetry={onRefresh} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{memberName}'s Activity</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{groupName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <View style={[styles.searchInputContainer, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search transactions..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary : 'rgba(255,255,255,0.05)', borderColor: showFilters ? colors.primary : 'rgba(255,255,255,0.1)' }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={24} color={showFilters ? colors.background : colors.text} />
          </TouchableOpacity>
        </View>
        
        {showFilters && (
          <View style={styles.expandedFilters}>
            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>START DATE</Text>
                <TextInput style={[styles.filterInput, { color: colors.text, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} value={startDate} onChangeText={setStartDate} />
              </View>
              <View style={styles.filterCol}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>END DATE</Text>
                <TextInput style={[styles.filterInput, { color: colors.text, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} value={endDate} onChangeText={setEndDate} />
              </View>
            </View>
            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>MIN AMOUNT</Text>
                <TextInput style={[styles.filterInput, { color: colors.text, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} placeholder="0.00" keyboardType="numeric" placeholderTextColor={colors.textSecondary} value={minAmount} onChangeText={setMinAmount} />
              </View>
              <View style={styles.filterCol}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>MAX AMOUNT</Text>
                <TextInput style={[styles.filterInput, { color: colors.text, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} placeholder="999.00" keyboardType="numeric" placeholderTextColor={colors.textSecondary} value={maxAmount} onChangeText={setMaxAmount} />
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No activity found for this member.</Text>
          </View>
        ) : (
          activities.map((item) => (
            <Card key={`${item.type}-${item.id}`} style={styles.card}>
              <View style={styles.itemRow}>
                <View style={[styles.iconContainer, { backgroundColor: item.type === "EXPENSE" ? 'rgba(0, 245, 255, 0.1)' : 'rgba(47, 248, 1, 0.1)' }]}>
                  <Ionicons 
                    name={item.type === "EXPENSE" ? "receipt-outline" : "cash-outline"} 
                    size={20} 
                    color={item.type === "EXPENSE" ? colors.primary : colors.success} 
                  />
                </View>
                
                <View style={styles.details}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle} · {item.date.toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.amountContainer}>
                  <Text style={[
                    styles.amount,
                    { color: item.isPositive ? colors.success : colors.error }
                  ]}>
                    {item.isPositive ? "+" : "-"}₹{item.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  card: {
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'JetBrains Mono',
  },
  filterSection: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, height: 44, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, fontFamily: 'Hanken Grotesk' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  expandedFilters: { marginTop: spacing.md, gap: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.md },
  filterCol: { flex: 1 },
  filterLabel: { fontSize: 10, fontFamily: 'JetBrains Mono', marginBottom: 4, letterSpacing: 1 },
  filterInput: { height: 40, borderRadius: 8, borderWidth: 1, paddingHorizontal: spacing.sm, fontSize: 14, fontFamily: 'Hanken Grotesk' },
});
