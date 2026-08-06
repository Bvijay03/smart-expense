import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";

const CATEGORIES = [
  { id: "travel", name: "Travel", icon: "airplane" },
  { id: "tech", name: "Tech", icon: "laptop" },
  { id: "emergency", name: "Emergency", icon: "medical" },
  { id: "lifestyle", name: "Lifestyle", icon: "home" },
];

const ACTIVE_GOALS = [
  {
    id: "1",
    title: "Japan Trip",
    date: "Oct 2024",
    icon: "airplane",
    percent: 42,
    current: 850,
    target: 2000,
  },
  {
    id: "2",
    title: "New MacBook",
    date: "Dec 2024",
    icon: "laptop",
    percent: 75,
    current: 1500,
    target: 2000,
  },
];

export function BudgetGoalsScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState("travel");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Budget Goals</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Monthly Target */}
        <View style={[styles.targetCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
          <View style={styles.ambientGlow} />
          <View style={styles.targetHeader}>
            <View style={[styles.targetIconBox, { backgroundColor: colors.primary + "33" }]}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.targetTitle, { color: colors.text }]}>Monthly Target</Text>
              <Text style={[styles.targetSub, { color: colors.textSecondary }]}>Recommended contribution</Text>
            </View>
          </View>
          <View style={styles.targetBody}>
            <View style={styles.targetAmountRow}>
              <Text style={[styles.targetAmount, { color: colors.primary }]}>$650</Text>
              <Text style={[styles.targetAmountPeriod, { color: colors.textSecondary }]}>/mo</Text>
            </View>
            <View style={styles.targetStatusCol}>
              <Text style={[styles.targetStatusText, { color: colors.success }]}>
                <Ionicons name="trending-up" size={14} color={colors.success} /> On track
              </Text>
              <Text style={[styles.targetStatusSub, { color: colors.textSecondary }]}>across all goals</Text>
            </View>
          </View>
        </View>

        {/* Categories Scroll */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    isActive 
                      ? { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "80" }
                      : { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.1)" }
                  ]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Ionicons name={cat.icon as any} size={18} color={isActive ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.catText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Goals Header */}
        <View style={styles.goalsHeaderRow}>
          <Text style={[styles.goalsTitle, { color: colors.text }]}>Active Goals</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {/* Goals List */}
        <View style={styles.goalsList}>
          {ACTIVE_GOALS.map((goal) => (
            <TouchableOpacity key={goal.id} style={[styles.goalCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
              <View style={styles.goalTopRow}>
                <View style={styles.goalTopLeft}>
                  <View style={[styles.goalIconBox, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }]}>
                    <Ionicons name={goal.icon as any} size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                    <Text style={[styles.goalDate, { color: colors.textSecondary }]}>
                      <Ionicons name="calendar" size={12} color={colors.textSecondary} /> {goal.date}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.goalPercent, { color: colors.primary }]}>{goal.percent}%</Text>
              </View>

              <View style={styles.goalProgressContainer}>
                <View style={styles.goalAmountsRow}>
                  <Text style={[styles.goalAmountCurrent, { color: colors.text }]}>${goal.current}</Text>
                  <Text style={[styles.goalAmountTarget, { color: colors.textSecondary }]}>${goal.target}</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                  <View style={[styles.progressFill, { width: `${goal.percent}%`, backgroundColor: colors.primary, shadowColor: colors.primary }]} />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add New Goal */}
          <TouchableOpacity style={[styles.newGoalCard, { borderColor: colors.primary + "4D" }]}>
            <View style={[styles.newGoalIconBox, { backgroundColor: colors.primary + "1A" }]}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.newGoalTitle, { color: colors.text }]}>Start a New Goal</Text>
            <Text style={[styles.newGoalSub, { color: colors.textSecondary }]}>Set your sights on something new</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 64, paddingHorizontal: spacing.md, borderBottomWidth: 1, zIndex: 50 },
  appBarBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  appBarTitle: { fontSize: 22, fontWeight: "700" },

  content: { paddingBottom: 100 },

  targetCard: { margin: spacing.md, padding: spacing.md, borderRadius: 16, borderWidth: 1, overflow: "hidden", position: "relative" },
  ambientGlow: { position: "absolute", top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(0,245,255,0.2)" },
  targetHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm, zIndex: 10 },
  targetIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  targetTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  targetSub: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  targetBody: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", zIndex: 10, marginTop: spacing.sm },
  targetAmountRow: { flexDirection: "row", alignItems: "baseline" },
  targetAmount: { fontSize: 48, fontFamily: "Hanken Grotesk", fontWeight: "700", letterSpacing: -1 },
  targetAmountPeriod: { fontSize: 16, fontFamily: "JetBrains Mono", marginLeft: 8 },
  targetStatusCol: { alignItems: "flex-end" },
  targetStatusText: { fontSize: 14, fontFamily: "JetBrains Mono", flexDirection: "row", alignItems: "center" },
  targetStatusSub: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 4 },

  categoriesContainer: { paddingVertical: spacing.xs },
  categoriesScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  catChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: 24, borderWidth: 1 },
  catText: { fontSize: 14, fontFamily: "Hanken Grotesk", fontWeight: "500" },

  goalsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  goalsTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  viewAllText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },

  goalsList: { paddingHorizontal: spacing.md, gap: spacing.sm },
  goalCard: { padding: spacing.md, borderRadius: 16, borderWidth: 1 },
  goalTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  goalTopLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  goalIconBox: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", shadowOffset: { width:0, height:0 }, shadowOpacity: 0.3, shadowRadius: 15 },
  goalTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  goalDate: { fontSize: 14, fontFamily: "JetBrains Mono", marginTop: 4 },
  goalPercent: { fontSize: 28, fontFamily: "Hanken Grotesk", fontWeight: "700" },
  
  goalProgressContainer: { gap: spacing.xs },
  goalAmountsRow: { flexDirection: "row", justifyContent: "space-between" },
  goalAmountCurrent: { fontSize: 14, fontFamily: "JetBrains Mono" },
  goalAmountTarget: { fontSize: 14, fontFamily: "JetBrains Mono" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", shadowOffset: { width:0, height:0 }, shadowOpacity: 0.8, shadowRadius: 10 },

  newGoalCard: { padding: spacing.md, paddingVertical: spacing.lg, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  newGoalIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  newGoalTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  newGoalSub: { fontSize: 16, fontFamily: "Hanken Grotesk", marginTop: 4 },
});
