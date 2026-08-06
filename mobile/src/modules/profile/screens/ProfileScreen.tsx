import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { Button } from "@/shared/components/Button";
import { getErrorMessage } from "@/shared/services/api";
import { api } from "@/shared/services/api";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { LinearGradient } from "expo-linear-gradient";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { colors, isDark, toggleTheme } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [editingSecurity, setEditingSecurity] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");

  const updateProfile = useMutation({
    mutationFn: (data: { name?: string; avatarUrl?: string }) => api.patch("/users/me", data),
    onSuccess: (res) => {
      setUser({ ...user!, ...res.data.data });
      setEditingProfile(false);
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsUploadingAvatar(true);
        const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        
        if (!cloudName || !uploadPreset) {
          Alert.alert("Configuration Error", "Cloudinary credentials not found.");
          setIsUploadingAvatar(false);
          return;
        }

        const data = {
          file: `data:image/jpeg;base64,${result.assets[0].base64}`,
          upload_preset: uploadPreset,
        };

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        const uploadJson = await uploadRes.json();
        
        if (uploadJson.secure_url) {
          await updateProfile.mutateAsync({ avatarUrl: uploadJson.secure_url });
        } else {
          Alert.alert("Upload Error", "Failed to upload image.");
        }
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong while picking the image.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const updateSecurity = useMutation({
    mutationFn: (data: { securityQuestion: string, securityAnswer: string }) => 
      api.put("/auth/security-question", data),
    onSuccess: () => {
      setEditingSecurity(false);
      setSecurityQuestion("");
      setSecurityAnswer("");
      Alert.alert("Success", "Security question updated.");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient background glow */}
      <View style={styles.ambientGlow} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0, 245, 255, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* TopAppBar */}
      <View style={[styles.topAppBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="wallet-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Smart Expense</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </Text>
                </View>
              )}
              {isUploadingAvatar && (
                <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.avatarEditBtn, { backgroundColor: colors.primary }]}
              onPress={pickImage}
              disabled={isUploadingAvatar}
            >
              <Ionicons name="camera" size={16} color="#000" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.profileName, { color: colors.primary }]}>{user?.name}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        {/* Stats Grid (Bento style) */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
            <View style={[styles.statGlow, { backgroundColor: colors.error + "1A" }]} />
            <View style={styles.statHeader}>
              <Ionicons name="trending-down" size={20} color={colors.textSecondary} />
              <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Total Spent</Text>
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.primary }]}>$4,250<Text style={styles.statCents}>.00</Text></Text>
              <Text style={[styles.statSub, { color: colors.error }]}><Ionicons name="arrow-up" size={12} /> 12% vs last month</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
            <View style={[styles.statGlow, { backgroundColor: colors.textSecondary + "1A" }]} />
            <View style={styles.statHeader}>
              <Ionicons name="sync" size={20} color={colors.textSecondary} />
              <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Total Owed</Text>
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.primary }]}>$840<Text style={styles.statCents}>.50</Text></Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Across 3 friends</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
            <View style={[styles.statGlow, { backgroundColor: colors.success + "1A" }]} />
            <View style={styles.statHeader}>
              <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Total Saved</Text>
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.primary }]}>$12,450<Text style={styles.statCents}>.00</Text></Text>
              <Text style={[styles.statSub, { color: colors.success }]}><Ionicons name="arrow-up" size={12} /> 5% vs last month</Text>
            </View>
          </View>
        </View>

        <View style={styles.twoColGrid}>
          {/* Personal Info Details */}
          <View style={[styles.glassCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
            <Text style={[styles.sectionHeading, { color: colors.primary }]}>Personal Details</Text>
            
            {editingProfile ? (
              <View style={styles.editForm}>
                <TextInput
                  style={[styles.inputField, { color: colors.text, borderColor: colors.primary, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Display Name"
                  placeholderTextColor={colors.textSecondary}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={() => updateProfile.mutate({ name: nameInput.trim() })}>
                    <Text style={{ color: '#000', fontWeight: "700" }}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setEditingProfile(false)}>
                    <Text style={{ color: colors.text }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Full Name</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>{user?.name}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.detailValueMono, { color: colors.primary }]}>+1 (555) 019-8234</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Member Since</Text>
                  <Text style={[styles.detailValueMono, { color: colors.primary }]}>Oct 2042</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.editProfileBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                  onPress={() => setEditingProfile(true)}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                  <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Connected Accounts */}
          <View style={[styles.glassCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.primary, borderBottomWidth: 0, marginBottom: 0 }]}>Connected Accounts</Text>
              <TouchableOpacity>
                <Ionicons name="add-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.accountRow, { backgroundColor: colors.surface + "80", borderColor: "rgba(255,255,255,0.05)" }]}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialIcons name="account-balance" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.accountName, { color: colors.primary }]}>NeoBank Checking</Text>
                  <Text style={[styles.accountNum, { color: colors.textSecondary }]}>**** 4921</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>

            <View style={[styles.accountRow, { backgroundColor: colors.surface + "80", borderColor: "rgba(255,255,255,0.05)" }]}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Ionicons name="card" size={20} color="#ffd2dc" />
                </View>
                <View>
                  <Text style={[styles.accountName, { color: colors.primary }]}>Quantum Credit</Text>
                  <Text style={[styles.accountNum, { color: colors.textSecondary }]}>**** 8832</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>

            <View style={[styles.accountRow, { backgroundColor: colors.surface + "80", borderColor: colors.error + "40" }]}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Ionicons name="logo-bitcoin" size={20} color={colors.error} />
                </View>
                <View>
                  <Text style={[styles.accountName, { color: colors.primary }]}>Crypto Wallet</Text>
                  <Text style={[styles.accountNum, { color: colors.error }]}>Sync Failed</Text>
                </View>
              </View>
              <Ionicons name="warning" size={20} color={colors.error} />
            </View>
          </View>
        </View>

        {/* Security Update Card */}
        {editingSecurity && (
          <View style={[styles.glassCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.primary + "80", marginTop: spacing.md }]}>
             <Text style={[styles.sectionHeading, { color: colors.primary }]}>Security Question</Text>
             <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(0,0,0,0.2)', marginBottom: 8 }]}
                placeholder="New Security Question"
                placeholderTextColor={colors.textSecondary}
                value={securityQuestion}
                onChangeText={setSecurityQuestion}
              />
              <TextInput
                style={[styles.inputField, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                placeholder="Security Answer"
                placeholderTextColor={colors.textSecondary}
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
              />
              <View style={[styles.editActions, { marginTop: 12 }]}>
                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
                  onPress={() => updateSecurity.mutate({ securityQuestion: securityQuestion.trim(), securityAnswer: securityAnswer.trim() })}
                  disabled={updateSecurity.isPending}
                >
                  <Text style={{ color: '#000', fontWeight: "700" }}>{updateSecurity.isPending ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setEditingSecurity(false); setSecurityQuestion(""); setSecurityAnswer(""); }}>
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
              </View>
          </View>
        )}

        {/* Preferences / Manage */}
        <View style={[styles.preferencesList, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
          <TouchableOpacity style={styles.prefItem} onPress={() => navigation.navigate("Friends")}>
            <View style={styles.prefLeft}>
              <Ionicons name="people-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.prefText, { color: colors.primary }]}>Friends</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.prefItem} onPress={() => navigation.navigate("Settings")}>
            <View style={styles.prefLeft}>
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.prefText, { color: colors.primary }]}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.prefItem} onPress={() => navigation.navigate("Categories")}>
            <View style={styles.prefLeft}>
              <Ionicons name="pricetag-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.prefText, { color: colors.primary }]}>Manage Categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity style={styles.prefItem} onPress={() => navigation.navigate("Recurring")}>
            <View style={styles.prefLeft}>
              <Ionicons name="repeat-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.prefText, { color: colors.primary }]}>Recurring Expenses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.prefItem} onPress={() => setEditingSecurity(!editingSecurity)}>
            <View style={styles.prefLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.prefText, { color: colors.primary }]}>Security Question</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.prefItem} onPress={toggleTheme}>
            <View style={styles.prefLeft}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.textSecondary} />
              <Text style={[styles.prefText, { color: colors.primary }]}>Theme ({isDark ? 'Dark' : 'Light'})</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.prefItem} onPress={handleLogout}>
            <View style={styles.prefLeft}>
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
              <Text style={[styles.prefText, { color: colors.error }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 400, opacity: 0.6 },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  appBarBtn: { padding: 8, borderRadius: 20 },
  appBarTitle: { fontSize: 22, fontWeight: "700" },
  
  content: { padding: spacing.md, paddingBottom: 100 },
  
  // Profile Header
  profileHeader: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.lg },
  avatarWrapper: { position: "relative", marginBottom: spacing.md },
  avatarContainer: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, padding: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    shadowColor: "#00f5ff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 60 },
  avatarPlaceholder: { width: "100%", height: "100%", borderRadius: 60, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 40, fontWeight: "700" },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  avatarEditBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#00f5ff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 5,
  },
  profileName: { fontSize: 28, fontWeight: "700", textAlign: "center", textShadowColor: "rgba(0,245,255,0.3)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  profileEmail: { fontSize: 14, marginTop: 4, fontFamily: "JetBrains Mono", opacity: 0.8 },

  // Stats Grid
  statsGrid: { flexDirection: "column", gap: spacing.sm, marginBottom: spacing.md },
  statCard: { padding: spacing.md, borderRadius: 16, borderWidth: 1, position: "relative", overflow: "hidden" },
  statGlow: { position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, filter: "blur(20px)" },
  statHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  statTitle: { fontSize: 16, fontWeight: "500" },
  statValue: { fontSize: 32, fontWeight: "700" },
  statCents: { fontSize: 20, color: "#b9caca" },
  statSub: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 4, flexDirection: "row", alignItems: "center" },

  // Layout
  twoColGrid: { flexDirection: "column", gap: spacing.md },
  glassCard: { padding: spacing.md, borderRadius: 16, borderWidth: 1 },
  sectionHeading: { fontSize: 20, fontWeight: "600", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", paddingBottom: 8, marginBottom: spacing.sm },
  
  // Personal Details
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: { fontSize: 16 },
  detailValue: { fontSize: 16, fontWeight: "500" },
  detailValueMono: { fontSize: 14, fontFamily: "JetBrains Mono" },
  editProfileBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: spacing.md, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  editProfileText: { fontSize: 16, fontWeight: "600" },
  
  editForm: { gap: spacing.sm },
  inputField: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  editActions: { flexDirection: "row", gap: spacing.sm },
  saveBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10 },
  cancelBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1 },

  // Connected Accounts
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", paddingBottom: 8, marginBottom: spacing.sm },
  accountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  accountLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  accountName: { fontSize: 16, fontWeight: "500" },
  accountNum: { fontSize: 12, fontFamily: "JetBrains Mono" },

  // Preferences List
  preferencesList: { borderRadius: 16, borderWidth: 1, marginTop: spacing.md },
  prefItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md },
  prefLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  prefText: { fontSize: 18, fontWeight: "500" },
  prefDivider: { height: 1, marginHorizontal: spacing.md },
});
