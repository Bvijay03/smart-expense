import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseService, categoryService } from "@/shared/services/modules";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { ScreenHeader } from "@/shared/components/Card";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { EXPENSE_CATEGORIES } from "@/shared/utils/constants";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

const schema = z.object({
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  expenseDate: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "EditExpense">;

export function EditExpenseScreen({ route, navigation }: Props) {
  const { expenseId, amount, category, expenseDate, notes } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((r) => r.data.data),
  });

  const categories = categoriesQuery.data?.map((c) => c.name) ?? [...EXPENSE_CATEGORIES];

  const { control, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        amount: String(amount),
        category: category as typeof EXPENSE_CATEGORIES[number],
        expenseDate: expenseDate.split("T")[0],
        notes: notes ?? "",
      },
    });

  const selectedCategory = watch("category");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => expenseService.update(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      navigation.goBack();
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const onSubmit = (data: FormData) => {
    setLoading(true);
    mutation.mutate(
      {
        amount: parseFloat(data.amount),
        category: data.category,
        expenseDate: data.expenseDate,
        notes: data.notes || undefined,
      },
      { onSettled: () => setLoading(false) },
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Edit Expense" />

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Amount"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              error={errors.amount?.message}
            />
          )}
        />

        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
        <View style={styles.chips}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, {
                backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                borderColor: colors.border,
              }]}
              onPress={() => setValue("category", cat)}
            >
              <Text style={{ color: selectedCategory === cat ? "#fff" : colors.text, fontSize: 13 }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Controller
          control={control}
          name="expenseDate"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Date (YYYY-MM-DD)"
              value={value}
              onChangeText={onChange}
              error={errors.expenseDate?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input label="Notes (optional)" value={value} onChangeText={onChange} />
          )}
        />

        <Button title="Save Changes" loading={loading} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  label: { fontSize: 14, fontWeight: "500", marginBottom: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 20, borderWidth: 1 },
});
