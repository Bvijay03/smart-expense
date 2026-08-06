import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { useNavigation } from "@react-navigation/native";

export function HelpScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "Account", icon: "person", color: colors.primary, sub: "Settings, Profile" },
    { id: "Payments", icon: "card", color: colors.secondary, sub: "Transfers, Cards" },
    { id: "Groups", icon: "people", color: colors.tertiary, sub: "Shared, Split" },
    { id: "Security", icon: "shield-checkmark", color: colors.error, sub: "Privacy, Alerts" },
  ];

  const recent = [
    { id: "1", title: "How to reset my password?" },
    { id: "2", title: "Understanding split payments" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Smart Expense</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>How can we assist you today?</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }
              ]}
              placeholder="Search for answers..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Categories Bento Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Topics</Text>
          <View style={styles.grid}>
            {categories.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.gridCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
                <View style={[styles.iconBox, { backgroundColor: cat.color + "33" }]}>
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{cat.id}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{cat.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recently Viewed */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Viewed</Text>
          <View style={styles.list}>
            {recent.map(item => (
              <TouchableOpacity key={item.id} style={[styles.listItem, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
                <View style={styles.listLeft}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.listTitle, { color: colors.text }]}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Support Action */}
        <View style={[styles.contactCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}>
          <View style={[styles.contactIconBg, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Ionicons name="headset" size={32} color="#000" />
          </View>
          <Text style={[styles.contactTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.contactSub, { color: colors.textSecondary }]}>Our support team is available 24/7 to assist you.</Text>
          
          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Ionicons name="chatbubbles" size={20} color="#000" />
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 40 },

  headerSection: { marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "Hanken Grotesk", marginBottom: 4 },
  subtitle: { fontSize: 16, fontFamily: "Hanken Grotesk", marginBottom: spacing.md },
  
  searchContainer: { position: "relative", width: "100%" },
  searchIcon: { position: "absolute", left: 16, top: 16, zIndex: 10 },
  searchInput: { width: "100%", height: 52, borderRadius: 12, borderBottomWidth: 1, paddingLeft: 44, paddingRight: 16, fontSize: 16, fontFamily: "Hanken Grotesk" },

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk", marginBottom: spacing.sm },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm },
  gridCard: { width: "48%", padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "flex-start" },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Hanken Grotesk", marginBottom: 2 },
  cardSub: { fontSize: 12, fontFamily: "JetBrains Mono" },

  list: { gap: spacing.sm },
  listItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12, borderWidth: 1 },
  listLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  listTitle: { fontSize: 16, fontFamily: "Hanken Grotesk" },

  contactCard: { padding: spacing.lg, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  contactIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: spacing.md, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8 },
  contactTitle: { fontSize: 22, fontWeight: "600", fontFamily: "Hanken Grotesk", marginBottom: 8 },
  contactSub: { fontSize: 14, fontFamily: "Hanken Grotesk", textAlign: "center", marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  contactBtnText: { color: "#000", fontSize: 16, fontWeight: "700", fontFamily: "Hanken Grotesk" },
});
