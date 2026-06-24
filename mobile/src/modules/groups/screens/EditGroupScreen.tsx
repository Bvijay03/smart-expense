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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groupService } from "@/shared/services/modules";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;
type Props = NativeStackScreenProps<RootStackParamList, "EditGroup">;

export function EditGroupScreen({ route, navigation }: Props) {
  const { groupId, name, description } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Fetch live group data for members
  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupService.get(groupId).then((r) => r.data.data),
  });

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name, description: description ?? "" },
  });

  const updateGroup = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      groupService.update(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      Alert.alert("Saved", "Group details updated");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const addMember = useMutation({
    mutationFn: ({ memberName, email }: { memberName: string; email?: string }) =>
      groupService.addMember(groupId, memberName, email || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      setNewMemberName("");
      setNewMemberEmail("");
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

  const onSubmit = (data: FormData) => {
    setLoading(true);
    updateGroup.mutate(
      { name: data.name, description: data.description || undefined },
      { onSettled: () => setLoading(false) },
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Group Settings" subtitle="Edit group details & manage members" />

        {/* ── Group Info ── */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Group Details</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Group Name" value={value} onChangeText={onChange} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input label="Description (optional)" value={value} onChangeText={onChange} />
            )}
          />
          <Button title="Save Details" loading={loading} onPress={handleSubmit(onSubmit)} />
        </Card>

        {/* ── Members Management ── */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Members ({group.data?.members?.length ?? 0})
          </Text>

          {group.isLoading ? (
            <Text style={{ color: colors.textSecondary }}>Loading...</Text>
          ) : (
            group.data?.members?.map((m) => (
              <View
                key={m.id}
                style={[styles.memberRow, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                    {m.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{m.user.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {m.user.email || "No email"} · {m.role}
                  </Text>
                </View>
                {m.role !== "ADMIN" && (
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: colors.error + "15" }]}
                    onPress={() => confirmRemoveMember(m.user.id, m.user.name)}
                  >
                    <Ionicons name="person-remove-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {/* Add member form */}
          <View style={[styles.addMemberSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.addMemberLabel, { color: colors.textSecondary }]}>Add New Member</Text>
            <Input
              label="Name *"
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="Enter member name"
            />
            <Input
              label="Email (optional)"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter email if registered"
            />
            <Button
              title="Add Member"
              variant="secondary"
              loading={addMember.isPending}
              onPress={() =>
                newMemberName.trim() &&
                addMember.mutate({ memberName: newMemberName.trim(), email: newMemberEmail.trim() || undefined })
              }
            />
          </View>
        </Card>

        <View style={styles.spacer} />
        <Button title="← Back to Group" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  memberRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 16, fontWeight: "700" },
  memberName: { fontSize: 15, fontWeight: "500" },
  removeBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  addMemberSection: { borderTopWidth: 1, marginTop: spacing.md, paddingTop: spacing.md },
  addMemberLabel: { fontSize: 14, fontWeight: "500", marginBottom: spacing.xs },
  spacer: { height: spacing.sm },
});
