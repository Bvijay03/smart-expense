import React, { useState } from "react";
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
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { groupService } from "@/shared/services/modules";
import { getErrorMessage } from "@/shared/services/api";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { useAuthStore } from "@/modules/authentication/store/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "EditGroup">;

export function EditGroupScreen({ route, navigation }: Props) {
  const { groupId, name: initialName } = route.params;
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [groupName, setGroupName] = useState(initialName);

  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupService.get(groupId).then((r) => r.data.data),
  });

  const updateGroup = useMutation({
    mutationFn: (data: { name: string }) => groupService.update(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      Alert.alert("Saved", "Group settings updated");
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

  const deleteGroup = useMutation({
    mutationFn: () => groupService.delete(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      Alert.alert("Deleted", "Group deleted successfully");
      navigation.navigate("MainTabs", { screen: "Groups" });
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmDeleteGroup = () => {
    Alert.alert("Delete Group", "Are you sure? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGroup.mutate() },
    ]);
  };

  const handleSave = () => {
    if (groupName !== initialName) {
      updateGroup.mutate({ name: groupName });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Group Settings</Text>
        <TouchableOpacity style={styles.appBarBtn} onPress={handleSave}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Group Info Section */}
          <View style={[styles.glassCard, styles.groupInfoCard, { borderColor: colors.border }]}>
            <View style={styles.ambientGlow} />
            <TouchableOpacity style={styles.avatarContainer}>
              <View style={[styles.avatarBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Image 
                  source={{ uri: "https://i.pravatar.cc/300" }} // Placeholder
                  style={styles.avatarImg}
                />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="pencil" size={24} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
            
            <View style={[styles.inputContainer, { borderBottomColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Members Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Members</Text>
              <TouchableOpacity 
                style={styles.addMemberBtn} 
                onPress={() => Alert.alert("Invite Members", "Please use the 'Admin' tab on the Group Details screen to add or invite members.")}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addMemberText, { color: colors.primary }]}>ADD MEMBER</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.glassCard, { borderColor: colors.border, padding: 0, overflow: "hidden" }]}>
              {group.isLoading ? (
                <View style={{ padding: 16 }}><Text style={{ color: colors.textSecondary }}>Loading...</Text></View>
              ) : (
                group.data?.members?.map((m, index) => (
                  <View 
                    key={m.id} 
                    style={[
                      styles.memberRow, 
                      index !== (group.data?.members?.length ?? 0) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                  >
                    <View style={styles.memberLeft}>
                      <View style={[styles.memberAvatar, { backgroundColor: colors.surfaceVariant }]}>
                        {m.user.avatarUrl ? (
                          <Image source={{ uri: m.user.avatarUrl }} style={styles.avatarImg} />
                        ) : (
                          <Text style={[styles.memberInitial, { color: colors.textSecondary }]}>{m.user.name.charAt(0)}</Text>
                        )}
                      </View>
                      <View>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {m.user.name} {m.user.id === user?.id ? "(You)" : ""}
                        </Text>
                        <Text style={[styles.memberRole, { color: m.role === "ADMIN" ? colors.primary : colors.textSecondary }]}>
                          {m.role === "ADMIN" ? "Admin" : "Member"}
                        </Text>
                      </View>
                    </View>
                    {m.role !== "ADMIN" && (
                      <TouchableOpacity style={styles.removeBtn} onPress={() => confirmRemoveMember(m.user.id, m.user.name)}>
                        <Ionicons name="person-remove" size={20} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Split Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
            <View style={[styles.glassCard, { borderColor: colors.border, padding: 0, overflow: "hidden" }]}>
              
              <TouchableOpacity style={[styles.prefRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.prefLeft}>
                  <View style={[styles.prefIcon, { backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name="pie-chart" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.prefName, { color: colors.text }]}>Default Split</Text>
                    <Text style={[styles.prefVal, { color: colors.textSecondary }]}>Equally</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View style={[styles.prefIcon, { backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name="cash" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.prefName, { color: colors.text }]}>Group Currency</Text>
                    <Text style={[styles.prefVal, { color: colors.textSecondary }]}>USD ($)</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

            </View>
          </View>

          {/* Settlement History */}
          <View style={styles.section}>
            <View style={[styles.glassCard, { borderColor: colors.border, padding: 0, overflow: "hidden" }]}>
              <TouchableOpacity style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View style={[styles.prefIcon, { backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name="time" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.prefName, { color: colors.text }]}>View Settlement History</Text>
                </View>
                <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <TouchableOpacity 
              style={[styles.deleteBtn, { backgroundColor: colors.error + "1A", borderColor: colors.error + "4D" }]}
              onPress={confirmDeleteGroup}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete Group</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 64, paddingHorizontal: spacing.md, borderBottomWidth: 1, zIndex: 50 },
  appBarBtn: { minWidth: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  appBarTitle: { fontSize: 22, fontWeight: "700" },
  saveText: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100, gap: spacing.md },

  glassCard: { borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  
  groupInfoCard: { alignItems: "center", padding: spacing.md, gap: spacing.sm, position: "relative" },
  ambientGlow: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,245,255,0.05)", borderRadius: 16 },
  avatarContainer: { marginTop: 16 },
  avatarBox: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, overflow: "hidden", shadowOffset: { width:0, height:4 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 8, position: "relative" },
  avatarImg: { width: "100%", height: "100%" },
  avatarOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", opacity: 0 }, // Would be animated in real app
  inputContainer: { width: "80%", borderBottomWidth: 2, paddingBottom: 4, marginTop: 16 },
  input: { textAlign: "center", fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "500", padding: 0 },

  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  addMemberBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addMemberText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },

  memberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  memberInitial: { fontSize: 16, fontFamily: "JetBrains Mono" },
  memberName: { fontSize: 16, fontFamily: "Hanken Grotesk", fontWeight: "400" },
  memberRole: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 2 },
  removeBtn: { padding: 8, borderRadius: 20 },

  prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  prefLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  prefIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  prefName: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  prefVal: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 2 },

  dangerZone: { marginTop: spacing.lg, marginBottom: spacing.md },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 16, borderWidth: 1, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 2 },
  deleteBtnText: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
});
