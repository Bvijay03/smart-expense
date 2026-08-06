import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { useNavigation } from "@react-navigation/native";

export function SearchScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeDate, setActiveDate] = useState("This Week");
  const [activeCategories, setActiveCategories] = useState<string[]>(["Shopping"]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [transactionType, setTransactionType] = useState("Personal");

  const dates = ["This Week", "This Month", "Custom Range"];
  const categories = [
    { id: "Food", color: "#FF3B30" },
    { id: "Transport", color: "#FF9500" },
    { id: "Shopping", color: colors.primary },
    { id: "Bills", color: "#AF52DE" },
  ];

  const toggleCategory = (id: string) => {
    setActiveCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const matches = [
    { id: '1', title: 'Uber Ride', date: 'Today, 2:30 PM', amount: '-$24.50', icon: 'car', color: '#FF9500' },
    { id: '2', title: 'Apple Store', date: 'Yesterday', amount: '-$1,299.00', icon: 'bag', color: colors.primary },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Search Transactions</Text>
        <View style={styles.appBarBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }
            ]}
            placeholder="Search by description or amount..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersSection}>
          {/* Date Range */}
          <View style={styles.filterBlock}>
            <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>Date Range</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
              {dates.map(date => {
                const isActive = activeDate === date;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? colors.primary + "1A" : colors.surfaceVariant,
                        borderColor: isActive ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setActiveDate(date)}
                  >
                    {date === "Custom Range" && <Ionicons name="calendar" size={16} color={isActive ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />}
                    <Text style={[
                      styles.pillText,
                      { color: isActive ? colors.primary : colors.textSecondary }
                    ]}>
                      {date.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Category Grid */}
          <View style={styles.filterBlock}>
            <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => {
                const isActive = activeCategories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBtn,
                      {
                        backgroundColor: isActive ? colors.primary + "1A" : colors.surfaceVariant,
                        borderColor: isActive ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: cat.color, shadowColor: cat.color, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width:0, height:0 } }]} />
                    <Text style={[styles.categoryText, { color: isActive ? colors.primary : colors.text }]}>{cat.id.toUpperCase()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Amount Range */}
          <View style={styles.filterBlock}>
            <View style={styles.amountHeader}>
              <Text style={[styles.filterTitle, { color: colors.textSecondary, marginBottom: 0 }]}>Amount</Text>
              <Text style={[styles.amountPreview, { color: colors.primary }]}>$0 - $5,000+</Text>
            </View>
            <View style={styles.amountRow}>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.amountSymbol, { color: colors.textSecondary }]}>$</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                  placeholder="Min"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={minAmount}
                  onChangeText={setMinAmount}
                />
              </View>
              <Text style={[styles.amountSeparator, { color: colors.textSecondary }]}>-</Text>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.amountSymbol, { color: colors.textSecondary }]}>$</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                  placeholder="Max"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                />
              </View>
            </View>
          </View>

          {/* Transaction Type Toggle */}
          <View style={styles.filterBlock}>
            <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>Transaction Type</Text>
            <View style={[styles.segmentControl, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              {["Personal", "Group"].map(type => {
                const isActive = transactionType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.segmentBtn,
                      isActive && { backgroundColor: colors.surface, shadowColor: "#000", elevation: 2, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width:0, height:2 } }
                    ]}
                    onPress={() => setTransactionType(type)}
                  >
                    <Text style={[styles.segmentText, { color: isActive ? colors.text : colors.textSecondary }]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Results Preview */}
        <View style={styles.resultsSection}>
          <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>Recent Matches</Text>
          <View style={styles.resultsList}>
            {matches.map(match => (
              <TouchableOpacity key={match.id} style={[styles.matchItem, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
                <View style={styles.matchLeft}>
                  <View style={[styles.matchIconBox, { backgroundColor: match.color + "33", borderColor: match.color + "4D" }]}>
                    <Ionicons name={match.icon as any} size={24} color={match.color} />
                  </View>
                  <View>
                    <Text style={[styles.matchTitle, { color: colors.text }]}>{match.title}</Text>
                    <Text style={[styles.matchDate, { color: colors.textSecondary }]}>{match.date}</Text>
                  </View>
                </View>
                <Text style={[styles.matchAmount, { color: colors.text }]}>{match.amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomActionArea}>
        <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
          <Ionicons name="filter" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 64, paddingHorizontal: spacing.md, borderBottomWidth: 1, zIndex: 50 },
  appBarBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  appBarTitle: { fontSize: 22, fontWeight: "700" },
  
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 120 },

  searchContainer: { position: "relative", width: "100%", marginBottom: spacing.lg },
  searchIcon: { position: "absolute", left: 16, top: 16, zIndex: 10 },
  searchInput: { width: "100%", height: 52, borderRadius: 12, borderWidth: 1, paddingLeft: 44, paddingRight: 16, fontSize: 16, fontFamily: "Hanken Grotesk" },

  filtersSection: { gap: spacing.md },
  filterBlock: { gap: spacing.sm },
  filterTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk", marginBottom: 4 },
  
  pillsRow: { gap: 12 },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, width: "47%" },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  amountHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amountPreview: { fontSize: 12, fontFamily: "JetBrains Mono" },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  amountInputContainer: { flex: 1, position: "relative" },
  amountSymbol: { position: "absolute", left: 12, top: 14, fontSize: 12, fontFamily: "JetBrains Mono", zIndex: 10 },
  amountInput: { width: "100%", height: 44, borderRadius: 8, borderWidth: 1, paddingLeft: 32, paddingRight: 12, fontSize: 12, fontFamily: "JetBrains Mono" },
  amountSeparator: { fontSize: 16 },

  segmentControl: { flexDirection: "row", padding: 4, borderRadius: 12, borderWidth: 1 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  segmentText: { fontSize: 20, fontFamily: "Hanken Grotesk" },

  divider: { height: 1, width: "100%", marginVertical: spacing.md },

  resultsSection: { gap: spacing.sm },
  resultsList: { gap: 12 },
  matchItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 16, borderWidth: 1 },
  matchLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  matchIconBox: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  matchTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  matchDate: { fontSize: 14, fontFamily: "Hanken Grotesk", marginTop: 2 },
  matchAmount: { fontSize: 14, fontFamily: "JetBrains Mono" },

  bottomActionArea: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md, paddingBottom: 32 },
  applyBtn: { width: "100%", height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  applyBtnText: { color: "#000", fontSize: 18, fontWeight: "700", fontFamily: "Hanken Grotesk", letterSpacing: 1 },
});
