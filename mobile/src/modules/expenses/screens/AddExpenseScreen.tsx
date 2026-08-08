import { useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { expenseService, categoryService, groupService } from "@/shared/services/modules";
import { RootStackParamList } from "@/shared/navigation/types";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { EXPENSE_CATEGORIES } from "@/shared/utils/constants";
import { spacing, borderRadius } from "@/shared/theme";

// Standard Material Icons for categories fallback
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: "restaurant",
  Transport: "car",
  Shopping: "cart",
  Travel: "airplane",
  Housing: "home",
  Entertainment: "game-controller",
  Bills: "receipt",
  Health: "medkit",
  Other: "grid",
};

export function AddExpenseScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  
  const [expenseType, setExpenseType] = useState<"personal" | "group">("personal");
  const [amountStr, setAmountStr] = useState("0");
  const [selectedCategory, setSelectedCategory] = useState("Food");
  const [notes, setNotes] = useState("");
  // keeping date simple for now
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((r) => r.data.data),
  });

  const categories = categoriesQuery.data?.map((c) => c.name) ?? [...EXPENSE_CATEGORIES];

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupService.list().then((r) => r.data.data),
  });
  
  const mutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      navigation.goBack();
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const onSave = () => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0.");
      return;
    }
    setLoading(true);
    mutation.mutate(
      {
        amount,
        category: selectedCategory,
        expenseDate,
        notes: notes || undefined,
      },
      { onSettled: () => setLoading(false) }
    );
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type Toggle */}
        <View style={styles.toggleContainer}>
          <View style={[styles.toggleWrap, { backgroundColor: colors.surface, borderColor: 'rgba(255,255,255,0.05)' }]}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                expenseType === "personal" && { backgroundColor: colors.primary, shadowColor: colors.primary, elevation: 10, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: {width: 0, height: 0} }
              ]}
              onPress={() => setExpenseType("personal")}
            >
              <Text style={[styles.toggleText, { color: expenseType === "personal" ? colors.background : colors.textSecondary }]}>
                Personal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                expenseType === "group" && { backgroundColor: colors.primary, shadowColor: colors.primary, elevation: 10, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: {width: 0, height: 0} }
              ]}
              onPress={() => setExpenseType("group")}
            >
              <Text style={[styles.toggleText, { color: expenseType === "group" ? colors.background : colors.textSecondary }]}>
                Group Split
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {expenseType === "personal" ? (
          <>
            {/* Amount Display */}
            <View style={styles.amountContainer}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySymbol, { color: colors.primary, textShadowColor: colors.primary + '80', textShadowRadius: 10 }]}>$</Text>
            <TextInput
              style={[styles.amountValue, { color: colors.primary, textShadowColor: colors.primary + '80', textShadowRadius: 10, minWidth: 100, textAlign: 'center' }]}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.primary + '80'}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Categories")}>
              <Text style={{ color: colors.primary, fontSize: 14 }}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const iconName = CATEGORY_ICONS[cat] || "grid";
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryItem, !isSelected && { opacity: 0.6 }]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <View style={[
                    styles.categoryIconWrap,
                    { 
                      backgroundColor: isSelected ? colors.primary + '33' : colors.surface,
                      borderColor: isSelected ? colors.primary : 'rgba(255,255,255,0.1)' 
                    },
                    isSelected && { shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 }
                  ]}>
                    <Ionicons name={iconName} size={24} color={isSelected ? colors.primary : colors.text} />
                  </View>
                  <Text style={[styles.categoryLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Details Form (Date & Notes) */}
        <View style={styles.detailsSection}>
          <View style={[styles.dateBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.dateLeft}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.dateText, { color: colors.text }]}
                value={expenseDate}
                onChangeText={setExpenseDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.notesContainer, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} style={styles.notesIcon} />
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              placeholder="What was this for?"
              placeholderTextColor={colors.textSecondary + '80'}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: spacing.sm }]}>SELECT A GROUP TO SPLIT WITH</Text>
            {groupsQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : groupsQuery.data?.length ? (
              <View style={{ gap: spacing.sm }}>
                {groupsQuery.data.map(group => (
                  <TouchableOpacity 
                    key={group.id} 
                    style={[styles.groupCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}
                    onPress={() => {
                      const members = group.members?.map(m => ({ id: m.user.id, name: m.user.name })) || [];
                      navigation.navigate("AddSharedExpense", {
                        groupId: group.id,
                        members,
                        prefill: {
                          amount: amountStr !== "0" ? amountStr : "",
                          description: notes,
                          category: selectedCategory,
                          expenseDate
                        }
                      });
                    }}
                  >
                    <Ionicons name="people" size={24} color={colors.primary} />
                    <Text style={[styles.groupName, { color: colors.text, flex: 1 }]}>{group.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>No groups found. Create one first!</Text>
            )}
          </View>
        )}

        </ScrollView>
      </KeyboardAvoidingView>
      {/* Sticky Bottom Action */}
      {expenseType === "personal" && (
        <View style={[styles.bottomAction, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[
            styles.addBtn, 
            { backgroundColor: colors.primary },
            loading && { opacity: 0.7 }
          ]}
          onPress={onSave}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={24} color={colors.background} />
          <Text style={[styles.addBtnText, { color: colors.background }]}>
            {loading ? "Saving..." : "Add Expense"}
          </Text>
        </TouchableOpacity>
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  closeBtn: { padding: 8, marginLeft: -8, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  scrollContent: { paddingBottom: 100 }, // space for sticky button
  
  toggleContainer: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  toggleWrap: { flexDirection: "row", padding: 4, borderRadius: 30, borderWidth: 1 },
  toggleBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 30, alignItems: "center" },
  toggleText: { fontSize: 14, fontWeight: "600", fontFamily: "Hanken Grotesk" },

  amountContainer: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  amountLabel: { fontSize: 12, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  amountRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
  currencySymbol: { fontSize: 48, fontWeight: "700", fontFamily: "Hanken Grotesk", marginRight: 4 },
  amountValue: { fontSize: 64, fontWeight: "700", fontFamily: "Hanken Grotesk", letterSpacing: -2, lineHeight: 72 },

  categoriesSection: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  categoriesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionLabel: { fontSize: 12, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 },
  categoriesScroll: { gap: spacing.md, paddingBottom: spacing.xs, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  categoryItem: { alignItems: "center", gap: 8, width: 64 },
  categoryIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  categoryLabel: { fontSize: 10, fontFamily: "JetBrains Mono" },

  detailsSection: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  dateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1 },
  dateLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateText: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  notesContainer: { flexDirection: "row", padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, minHeight: 100 },
  notesIcon: { marginRight: 12, marginTop: 2 },
  notesInput: { flex: 1, fontSize: 16, fontFamily: "Hanken Grotesk", textAlignVertical: "top" },

  groupCard: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, gap: spacing.sm },
  groupName: { fontSize: 16, fontWeight: "500", fontFamily: "Hanken Grotesk" },

  bottomAction: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.md, paddingBottom: spacing.xl, paddingTop: spacing.md },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 56, borderRadius: 28, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 },
  addBtnText: { fontSize: 18, fontWeight: "600", fontFamily: "Hanken Grotesk" }
});

