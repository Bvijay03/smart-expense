import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { sharedExpenseService, categoryService, expenseService } from "@/shared/services/modules";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { ScreenHeader } from "@/shared/components/Card";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { EXPENSE_CATEGORIES } from "@/shared/utils/constants";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { useAuthStore } from "@/modules/authentication/store/authStore";

const schema = z.object({
  description: z.string().min(1),
  amount: z.string().min(1),
  category: z.string().min(1),
  expenseDate: z.string().min(1),
});

type FormData = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "AddSharedExpense">;

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

export function AddSharedExpenseScreen({ route, navigation }: Props) {
  const { groupId, members, prefill } = route.params;
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENTAGE">("EQUAL");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((r) => r.data.data),
  });

  const categories = categoriesQuery.data?.map((c) => c.name) ?? EXPENSE_CATEGORIES;
  const [paidById, setPaidById] = useState(user?.id ?? members[0]?.id);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [loading, setLoading] = useState(false);

  const allSelected = selectedMemberIds.size === members.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedMemberIds(new Set([paidById]));
    } else {
      setSelectedMemberIds(new Set(members.map((m) => m.id)));
    }
  };

  const toggleMember = (memberId: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(memberId)) {
      if (next.size <= 1) return;
      next.delete(memberId);
    } else {
      next.add(memberId);
    }
    setSelectedMemberIds(next);
  };

  const selectedMembers = members.filter((m) => selectedMemberIds.has(m.id));

  const { control, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        description: prefill?.description ?? "",
        amount: prefill?.amount ?? "",
        category: prefill?.category ?? "Food",
        expenseDate: prefill?.expenseDate ?? new Date().toISOString().split("T")[0],
      },
    });

  const category = watch("category");
  const amountStr = watch("amount");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      sharedExpenseService.create(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      navigation.goBack();
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const onSubmit = (data: FormData) => {
    if (selectedMembers.length === 0) {
      Alert.alert("Error", "Select at least one member to split with");
      return;
    }

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0.");
      return;
    }

    const splits = selectedMembers.map((m) => ({
      userId: m.id,
      value: splitType === "EQUAL" ? 0 : splitType === "PERCENTAGE" ? 100 / selectedMembers.length : amount / selectedMembers.length,
    }));

    setLoading(true);
    mutation.mutate(
      {
        description: data.description,
        amount,
        category: data.category,
        expenseDate: data.expenseDate,
        paidById,
        splitType,
        splits,
      },
      { onSettled: () => setLoading(false) },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shared Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Amount Display */}
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currencySymbol, { color: colors.primary, textShadowColor: colors.primary + '80', textShadowRadius: 10 }]}>$</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.amountValue, { color: colors.primary, textShadowColor: colors.primary + '80', textShadowRadius: 10, minWidth: 100, textAlign: 'center' }]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.primary + '80'}
                  />
                )}
              />
            </View>
            {errors.amount && <Text style={{ color: colors.error, marginTop: 4 }}>{errors.amount.message}</Text>}
          </View>

          {/* Description */}
          <View style={[styles.detailsSection, { paddingBottom: spacing.md }]}>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.notesContainer, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', minHeight: 60 }]}>
                  <Ionicons name="create-outline" size={20} color={colors.textSecondary} style={styles.notesIcon} />
                  <TextInput
                    style={[styles.notesInput, { color: colors.text }]}
                    placeholder="What was this for?"
                    placeholderTextColor={colors.textSecondary + '80'}
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
            {errors.description && <Text style={{ color: colors.error, marginLeft: 16 }}>{errors.description.message}</Text>}
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <View style={styles.categoriesHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {categories.map((cat) => {
                const isSelected = category === cat;
                const iconName = CATEGORY_ICONS[cat] || "grid";
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryItem, !isSelected && { opacity: 0.6 }]}
                    onPress={() => setValue("category", cat)}
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

          {/* Paid By & Split */}
          <View style={styles.detailsSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PAID BY</Text>
            <View style={styles.chipsRow}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.selectChip, { backgroundColor: paidById === m.id ? colors.primary : 'rgba(255,255,255,0.05)', borderColor: paidById === m.id ? colors.primary : 'rgba(255,255,255,0.1)' }]}
                  onPress={() => setPaidById(m.id)}
                >
                  <Text style={{ color: paidById === m.id ? colors.background : colors.text, fontWeight: paidById === m.id ? "700" : "500" }}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.categoriesHeader, { marginTop: spacing.md }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SPLIT AMONG</Text>
              <TouchableOpacity onPress={toggleAll}>
                <Text style={{ color: colors.primary, fontSize: 14 }}>{allSelected ? "Deselect All" : "Select All"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.memberList}>
              {members.map((m) => {
                const isSelected = selectedMemberIds.has(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.memberRow,
                      {
                        backgroundColor: isSelected ? colors.primary + "1A" : 'rgba(255,255,255,0.05)',
                        borderColor: isSelected ? colors.primary : 'rgba(255,255,255,0.1)',
                      },
                    ]}
                    onPress={() => toggleMember(m.id)}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: isSelected ? colors.primary : colors.text,
                        marginLeft: 12,
                        fontSize: 16,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>SPLIT TYPE</Text>
            <View style={styles.chipsRow}>
              {(["EQUAL", "EXACT", "PERCENTAGE"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.selectChip, { backgroundColor: splitType === type ? colors.primary : 'rgba(255,255,255,0.05)', borderColor: splitType === type ? colors.primary : 'rgba(255,255,255,0.1)' }]}
                  onPress={() => setSplitType(type)}
                >
                  <Text style={{ color: splitType === type ? colors.background : colors.text, fontWeight: splitType === type ? "700" : "500", fontSize: 12 }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: spacing.sm }]}>DATE</Text>
              <Controller
                control={control}
                name="expenseDate"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.dateBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <View style={styles.dateLeft}>
                      <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.dateText, { color: colors.text }]}
                        value={value}
                        onChangeText={onChange}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Action */}
      <View style={[styles.bottomAction, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[
            styles.addBtn, 
            { backgroundColor: colors.primary },
            loading && { opacity: 0.7 }
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Ionicons name="people" size={24} color={colors.background} />
          <Text style={[styles.addBtnText, { color: colors.background }]}>
            {loading ? "Saving..." : "Split Expense"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  closeBtn: { padding: 8, marginLeft: -8, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  scrollContent: { paddingBottom: 100 },
  
  amountContainer: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  amountLabel: { fontSize: 12, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  amountRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
  currencySymbol: { fontSize: 48, fontWeight: "700", fontFamily: "Hanken Grotesk", marginRight: 4 },
  amountValue: { fontSize: 64, fontWeight: "700", fontFamily: "Hanken Grotesk", letterSpacing: -2, lineHeight: 72 },

  categoriesSection: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  categoriesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionLabel: { fontSize: 12, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 },
  categoriesScroll: { gap: spacing.md, paddingBottom: spacing.xs, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  categoryItem: { alignItems: "center", gap: 8, width: 64 },
  categoryIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  categoryLabel: { fontSize: 10, fontFamily: "JetBrains Mono" },

  detailsSection: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  dateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  dateLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateText: { fontSize: 16, fontFamily: "Hanken Grotesk", flex: 1 },
  notesContainer: { flexDirection: "row", padding: spacing.md, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  notesIcon: { marginRight: 12 },
  notesInput: { flex: 1, fontSize: 16, fontFamily: "Hanken Grotesk" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  selectChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  
  memberList: { gap: 8, marginBottom: spacing.sm },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },

  bottomAction: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.md, paddingBottom: spacing.xl, paddingTop: spacing.md },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 56, borderRadius: 28, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 },
  addBtnText: { fontSize: 18, fontWeight: "600", fontFamily: "Hanken Grotesk" }
});
