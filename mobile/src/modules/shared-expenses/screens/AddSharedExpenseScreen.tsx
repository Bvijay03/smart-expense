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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { sharedExpenseService } from "@/shared/services/modules";
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
  category: z.enum(EXPENSE_CATEGORIES),
  expenseDate: z.string().min(1),
});

type FormData = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "AddSharedExpense">;

export function AddSharedExpenseScreen({ route, navigation }: Props) {
  const { groupId, members } = route.params;
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENTAGE">("EQUAL");
  const [paidById, setPaidById] = useState(user?.id ?? members[0]?.id);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [loading, setLoading] = useState(false);

  const allSelected = selectedMemberIds.size === members.length;

  const toggleAll = () => {
    if (allSelected) {
      // Deselect all except the payer (payer must always be included)
      setSelectedMemberIds(new Set([paidById]));
    } else {
      setSelectedMemberIds(new Set(members.map((m) => m.id)));
    }
  };

  const toggleMember = (memberId: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(memberId)) {
      // Don't allow deselecting if it's the last selected member
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
        description: "",
        amount: "",
        category: "Food",
        expenseDate: new Date().toISOString().split("T")[0],
      },
    });

  const category = watch("category");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      sharedExpenseService.create(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Add Shared Expense" />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input label="Description" value={value} onChangeText={onChange} error={errors.description?.message} />
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input label="Amount" value={value} onChangeText={onChange} keyboardType="decimal-pad" error={errors.amount?.message} />
          )}
        />

        <Text style={[styles.label, { color: colors.text }]}>Paid by</Text>
        <View style={styles.chips}>
          {members.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, { backgroundColor: paidById === m.id ? colors.primary : colors.surface, borderColor: colors.border }]}
              onPress={() => setPaidById(m.id)}
            >
              <Text style={{ color: paidById === m.id ? "#fff" : colors.text }}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Split among</Text>
        <View style={styles.chips}>
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: allSelected ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleAll}
          >
            <Text style={{ color: allSelected ? "#fff" : colors.text, fontWeight: "600" }}>
              All ({members.length})
            </Text>
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
                    backgroundColor: isSelected ? colors.primary + "18" : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleMember(m.id)}
              >
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={20}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={{
                    color: isSelected ? colors.text : colors.textSecondary,
                    marginLeft: 8,
                    fontWeight: isSelected ? "500" : "400",
                  }}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: spacing.sm }}>
          {selectedMembers.length} of {members.length} members selected
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Split type</Text>
        <View style={styles.chips}>
          {(["EQUAL", "EXACT", "PERCENTAGE"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, { backgroundColor: splitType === type ? colors.primary : colors.surface, borderColor: colors.border }]}
              onPress={() => setSplitType(type)}
            >
              <Text style={{ color: splitType === type ? "#fff" : colors.text }}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
        <View style={styles.chips}>
          {EXPENSE_CATEGORIES.slice(0, 5).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.surface, borderColor: colors.border }]}
              onPress={() => setValue("category", cat)}
            >
              <Text style={{ color: category === cat ? "#fff" : colors.text, fontSize: 12 }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Controller
          control={control}
          name="expenseDate"
          render={({ field: { onChange, value } }) => (
            <Input label="Date (YYYY-MM-DD)" value={value} onChangeText={onChange} />
          )}
        />

        <Button title="Save" loading={loading} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  label: { fontSize: 14, fontWeight: "500", marginBottom: spacing.xs, marginTop: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 20, borderWidth: 1 },
  memberList: { gap: 6, marginBottom: spacing.sm },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
