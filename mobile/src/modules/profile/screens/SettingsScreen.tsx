import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Switch
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/modules/authentication/store/authStore";

export function SettingsScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name || "Alex Vance");
  const [email, setEmail] = useState(user?.email || "alex.vance@example.com");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Smart Expense</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your account details, security preferences, and data.</Text>
        </View>

        {/* Personal Information */}
        <View style={[styles.glassCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Personal Information</Text>
          </View>

          <View style={styles.personalInfoBody}>
            <View style={styles.avatarSection}>
              <View style={[styles.avatarContainer, { borderColor: colors.border }]}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.avatarInitials, { color: colors.primary }]}>{user?.name?.charAt(0) || "A"}</Text>
                  </View>
                )}
                <View style={styles.avatarCamera}>
                  <Ionicons name="camera" size={16} color="#FFF" />
                </View>
              </View>
              <Text style={[styles.avatarChangeText, { color: colors.textSecondary }]}>CHANGE AVATAR</Text>
            </View>

            <View style={styles.formSection}>
              <View style={[styles.inputGroup, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={[styles.inputGroup, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
              <View style={[styles.inputGroup, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PHONE NUMBER</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.saveActionRow}>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.glassCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Data Management</Text>
          </View>

          <View style={styles.dataBlock}>
            <View style={[styles.dataItem, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataTitle, { color: colors.text }]}>Export Financial Data</Text>
                <Text style={[styles.dataSub, { color: colors.textSecondary }]}>Download a CSV of all your transactions and groups.</Text>
              </View>
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.border }]}>
                <Ionicons name="download" size={16} color={colors.text} />
                <Text style={[styles.outlineBtnText, { color: colors.text }]}>EXPORT CSV</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.dataItem, { backgroundColor: colors.error + "20", borderColor: colors.error + "40" }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataTitle, { color: colors.error }]}>Delete Account</Text>
                <Text style={[styles.dataSub, { color: colors.textSecondary }]}>Permanently remove your account and all associated data.</Text>
              </View>
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.error, backgroundColor: colors.error + "1A" }]}>
                <Ionicons name="trash" size={16} color={colors.error} />
                <Text style={[styles.outlineBtnText, { color: colors.error }]}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={[styles.glassCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Security</Text>
          </View>

          <View style={styles.securityBlock}>
            <View style={styles.secRow}>
              <Ionicons name="key" size={20} color={colors.textSecondary} />
              <Text style={[styles.secRowTitle, { color: colors.text }]}>Password</Text>
            </View>
            <View style={[styles.inputGroup, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CURRENT PASSWORD</Text>
              <TextInput style={[styles.input, { color: colors.text }]} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
            </View>
            <View style={[styles.inputGroup, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NEW PASSWORD</Text>
              <TextInput style={[styles.input, { color: colors.text }]} secureTextEntry placeholder="Enter new password" placeholderTextColor={colors.textSecondary} value={newPassword} onChangeText={setNewPassword} />
            </View>
            <TouchableOpacity style={[styles.updateBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
              <Text style={[styles.updateBtnText, { color: colors.text }]}>UPDATE PASSWORD</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.securityBlock}>
            <View style={styles.secRow}>
              <Ionicons name="finger-print" size={20} color={colors.textSecondary} />
              <Text style={[styles.secRowTitle, { color: colors.text }]}>Biometric Lock</Text>
            </View>
            <View style={[styles.bioRow, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" }]}>
              <View>
                <Text style={[styles.dataTitle, { color: colors.text }]}>Face ID / Touch ID</Text>
                <Text style={[styles.dataSub, { color: colors.textSecondary }]}>Require biometrics to open app</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#FFF"}
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.securityBlock}>
            <View style={styles.secRow}>
              <Ionicons name="hardware-chip" size={20} color={colors.textSecondary} />
              <Text style={[styles.secRowTitle, { color: colors.text }]}>Active Devices</Text>
            </View>
            <View style={styles.deviceList}>
              <View style={styles.deviceItem}>
                <View style={styles.deviceLeft}>
                  <Ionicons name="phone-portrait" size={24} color={colors.primary} />
                  <View>
                    <Text style={[styles.deviceTitle, { color: colors.text }]}>iPhone 14 Pro</Text>
                    <Text style={[styles.deviceSub, { color: colors.textSecondary }]}>Active now • San Francisco</Text>
                  </View>
                </View>
              </View>
              
              <View style={[styles.deviceItem, { opacity: 0.7 }]}>
                <View style={styles.deviceLeft}>
                  <Ionicons name="laptop" size={24} color={colors.textSecondary} />
                  <View>
                    <Text style={[styles.deviceTitle, { color: colors.text }]}>MacBook Air M2</Text>
                    <Text style={[styles.deviceSub, { color: colors.textSecondary }]}>Last active 2d ago</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Text style={[styles.revokeText, { color: colors.error }]}>REVOKE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

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
  
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 60, gap: spacing.md },

  header: { marginBottom: spacing.sm },
  title: { fontSize: 32, fontWeight: "700", fontFamily: "Hanken Grotesk", marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: "Hanken Grotesk" },

  glassCard: { borderRadius: 16, borderWidth: 1, padding: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: "600", fontFamily: "Hanken Grotesk" },

  personalInfoBody: { flexDirection: "column", gap: spacing.md },
  avatarSection: { alignItems: "center", gap: 12 },
  avatarContainer: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, position: "relative", overflow: "hidden" },
  avatarPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 32, fontWeight: "700" },
  avatarImg: { width: "100%", height: "100%" },
  avatarCamera: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 4, alignItems: "center" },
  avatarChangeText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 1 },
  
  formSection: { flex: 1, gap: 12 },
  inputGroup: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, height: 56, justifyContent: "center" },
  inputLabel: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 1, marginBottom: 2 },
  input: { fontSize: 16, fontFamily: "Hanken Grotesk", padding: 0 },

  saveActionRow: { alignItems: "flex-end", marginTop: spacing.md },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  saveBtnText: { color: "#000", fontSize: 14, fontFamily: "JetBrains Mono", fontWeight: "600", letterSpacing: 0.5 },

  dataBlock: { gap: 12 },
  dataItem: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  dataTitle: { fontSize: 16, fontFamily: "Hanken Grotesk", marginBottom: 4 },
  dataSub: { fontSize: 14, fontFamily: "Hanken Grotesk", opacity: 0.8 },
  outlineBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  outlineBtnText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },

  securityBlock: { gap: 12 },
  secRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  secRowTitle: { fontSize: 16, fontFamily: "Hanken Grotesk", fontWeight: "500" },
  updateBtn: { paddingVertical: 12, alignItems: "center", borderRadius: 8, borderWidth: 1, marginTop: 4 },
  updateBtnText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },

  divider: { height: 1, marginVertical: spacing.md },
  bioRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1 },

  deviceList: { gap: 12 },
  deviceItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deviceLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  deviceTitle: { fontSize: 14, fontFamily: "Hanken Grotesk" },
  deviceSub: { fontSize: 12, fontFamily: "Hanken Grotesk", marginTop: 2 },
  revokeText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },
});
