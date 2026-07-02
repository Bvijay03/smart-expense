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
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetService, categoryService } from "@/shared/services/modules";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { ScreenHeader } from "@/shared/components/Card";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { EXPENSE_CATEGORIES } from "@/shared/utils/constants";
import { spacing } from "@/shared/theme";

const schema = z.object({
  amount: z.string().min(1),
  month: z.string().min(1),
  year: z.string().min(4),
});

type FormData = z.infer<typeof schema>;

export function AddBudgetScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const now = new Date();
  const [category, setCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((r) => r.data.data),
  });

  const categories = ["ALL", ...(categoriesQuery.data?.map((c) => c.name) ?? EXPENSE_CATEGORIES)];

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    },
  });

  const mutation = useMutation({
    mutationFn: budgetService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      navigation.goBack();
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const onSubmit = (data: FormData) => {
    setLoading(true);
    mutation.mutate(
      {
        category,
        amount: parseFloat(data.amount),
        month: parseInt(data.month, 10),
        year: parseInt(data.year, 10),
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
        <ScreenHeader title="Set Budget" />

        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
        <View style={styles.chips}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.surface, borderColor: colors.border }]}
              onPress={() => setCategory(cat)}
            >
              <Text style={{ color: category === cat ? "#fff" : colors.text, fontSize: 12 }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input label="Budget Amount" value={value} onChangeText={onChange} keyboardType="decimal-pad" error={errors.amount?.message} />
          )}
        />
        <Controller
          control={control}
          name="month"
          render={({ field: { onChange, value } }) => (
            <Input label="Month (1-12)" value={value} onChangeText={onChange} keyboardType="number-pad" />
          )}
        />
        <Controller
          control={control}
          name="year"
          render={({ field: { onChange, value } }) => (
            <Input label="Year" value={value} onChangeText={onChange} keyboardType="number-pad" />
          )}
        />

        <Button title="Save Budget" loading={loading} onPress={handleSubmit(onSubmit)} />
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
