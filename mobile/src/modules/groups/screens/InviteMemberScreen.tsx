import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { useNavigation } from "@react-navigation/native";

export function InviteMemberScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");

  const suggestedContacts = [
    {
      id: "1",
      name: "Elena R.",
      handle: "@elena_fi",
      avatar: "https://i.pravatar.cc/150?u=elena",
      status: "invite",
    },
    {
      id: "2",
      name: "Marcus T.",
      handle: "@marcus_dev",
      avatar: "https://i.pravatar.cc/150?u=marcus",
      status: "invite",
    },
    {
      id: "3",
      name: "Sarah K.",
      handle: "@sarahk",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      status: "sent",
    },
    {
      id: "4",
      name: "James W.",
      handle: "james@example.com",
      avatar: "",
      status: "invite",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Invite Members</Text>
        <View style={styles.appBarBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Share Invite Link */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Share Invite Link</Text>
          <View style={[styles.glassCard, { borderColor: colors.border }]}>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1}>
                smart-expense.app/invite/gr_9xk2...
              </Text>
              <Text style={[styles.expiresText, { color: colors.primary }]}>LINK EXPIRES IN 24H</Text>
            </View>
            <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Ionicons name="copy-outline" size={18} color="#000" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Find Contacts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Find Contacts</Text>
          <View style={[styles.searchInputContainer, { backgroundColor: "rgba(255,255,255,0.03)", borderBottomColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name, email, or @username"
              placeholderTextColor={colors.textSecondary + "80"}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Suggested */}
        <View style={styles.section}>
          <View style={styles.suggestedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Suggested</Text>
            <Text style={[styles.suggestedSub, { color: colors.textSecondary }]}>BASED ON RECENT GROUPS</Text>
          </View>
          
          <View style={styles.grid}>
            {suggestedContacts.map((contact) => (
              <View 
                key={contact.id} 
                style={[
                  styles.contactCard, 
                  { borderColor: contact.status === "sent" ? colors.primary + "4D" : colors.border },
                  contact.status === "sent" && { backgroundColor: colors.primary + "0D" }
                ]}
              >
                <View style={[styles.avatarContainer, { borderColor: contact.status === "sent" ? colors.primary : colors.primary + "4D" }]}>
                  {contact.avatar ? (
                    <Image source={{ uri: contact.avatar }} style={[styles.avatarImg, contact.status === "sent" && { opacity: 0.8 }]} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>{contact.name.charAt(0)}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>{contact.name}</Text>
                  <Text style={[styles.contactHandle, { color: colors.textSecondary }]} numberOfLines={1}>{contact.handle}</Text>
                </View>

                {contact.status === "sent" ? (
                  <View style={[styles.inviteBtn, styles.sentBtn, { borderColor: colors.primary + "80" }]}>
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                    <Text style={[styles.sentBtnText, { color: colors.primary }]}>Sent</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                    <Text style={[styles.inviteBtnText, { color: colors.text }]}>Invite</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
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
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100, gap: spacing.lg },

  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  
  glassCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.05)", gap: spacing.sm },
  linkInfo: { flex: 1, gap: 4 },
  linkText: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  expiresText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5, textShadowColor: "rgba(0, 245, 255, 0.3)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 5 },
  copyBtnText: { color: "#000", fontSize: 14, fontFamily: "Hanken Grotesk", fontWeight: "600" },

  searchInputContainer: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 2 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Hanken Grotesk", padding: 0 },

  suggestedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  suggestedSub: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  contactCard: { width: "47%", padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.05)" },
  
  avatarContainer: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarImg: { width: "100%", height: "100%" },
  avatarPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 24, fontWeight: "700" },
  
  contactInfo: { alignItems: "center", gap: 4, width: "100%" },
  contactName: { fontSize: 16, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  contactHandle: { fontSize: 12, fontFamily: "JetBrains Mono" },

  inviteBtn: { width: "100%", paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  inviteBtnText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },
  sentBtn: { flexDirection: "row", gap: 4, backgroundColor: "transparent", opacity: 0.7 },
  sentBtnText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },
});
