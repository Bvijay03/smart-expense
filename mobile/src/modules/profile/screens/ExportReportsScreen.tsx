import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { useNavigation } from "@react-navigation/native";

export function ExportReportsScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();

  const [dateRange, setDateRange] = useState("This Month");
  const [format, setFormat] = useState("PDF");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [itemizedReceipts, setItemizedReceipts] = useState(false);

  const dates = ["This Month", "Last Quarter", "Custom"];
  const formats = [
    { id: "PDF", icon: "document-text" },
    { id: "CSV", icon: "grid" },
    { id: "EXCEL", icon: "cellular" },
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
          <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Export Reports</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Generate and download your financial data.</Text>
        </View>

        <View style={styles.mainLayout}>
          
          {/* Controls (Left on desktop, stacked on mobile) */}
          <View style={styles.controlsSection}>
            
            {/* Date Range Selection */}
            <View style={[styles.glassPanel, { borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Date Range</Text>
              </View>
              <View style={styles.dateGrid}>
                {dates.map((d) => {
                  const isActive = dateRange === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dateOption,
                        { borderColor: isActive ? colors.primary : colors.border },
                        isActive && { backgroundColor: "rgba(0, 245, 255, 0.1)" }
                      ]}
                      onPress={() => setDateRange(d)}
                    >
                      <Text style={[styles.dateOptionText, { color: isActive ? colors.primary : colors.text }]}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Format Selection */}
            <View style={[styles.glassPanel, { borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Format</Text>
              </View>
              <View style={styles.formatGrid}>
                {formats.map((f) => {
                  const isActive = format === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.formatOption,
                        { borderColor: isActive ? colors.primary : colors.border },
                        isActive && { backgroundColor: "rgba(0, 245, 255, 0.1)" }
                      ]}
                      onPress={() => setFormat(f.id)}
                    >
                      <Ionicons name={f.icon as any} size={32} color={isActive ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.formatOptionText, { color: isActive ? colors.primary : colors.text }]}>{f.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Toggles */}
            <View style={[styles.glassPanel, { borderColor: colors.border, paddingVertical: 12 }]}>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleText, { color: colors.text }]}>Include Charts</Text>
                <Switch
                  value={includeCharts}
                  onValueChange={setIncludeCharts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={"#FFF"}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleText, { color: colors.text }]}>Itemized Receipts</Text>
                <Switch
                  value={itemizedReceipts}
                  onValueChange={setItemizedReceipts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={"#FFF"}
                />
              </View>
            </View>

          </View>

          {/* Preview Section */}
          <View style={styles.previewSection}>
            <View style={[styles.glassPanel, styles.previewPanel, { borderColor: colors.border }]}>
              
              <View style={styles.previewHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Report Preview</Text>
                <View style={[styles.liveBadge, { backgroundColor: "rgba(0, 245, 255, 0.1)" }]}>
                  <Text style={[styles.liveBadgeText, { color: colors.primary }]}>LIVE</Text>
                </View>
              </View>

              <View style={[styles.mockDoc, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, shadowColor: "#000" }]}>
                
                <View style={[styles.docHeader, { borderBottomColor: colors.border }]}>
                  <View>
                    <Text style={[styles.docSub, { color: colors.textSecondary }]}>MONTHLY SPENDING</Text>
                    <Text style={[styles.docTitle, { color: colors.text }]}>$4,250.00</Text>
                  </View>
                  <Text style={[styles.docDate, { color: colors.textSecondary }]}>Nov 2023</Text>
                </View>

                {includeCharts && (
                  <>
                    <View style={[styles.miniChart, { borderBottomColor: colors.border }]}>
                      <View style={[styles.bar, { height: "40%", backgroundColor: colors.surface + "E6" }]} />
                      <View style={[styles.bar, { height: "85%", backgroundColor: colors.primary + "4D", borderColor: colors.primary, borderWidth: 1 }]} />
                      <View style={[styles.bar, { height: "30%", backgroundColor: colors.surface + "E6" }]} />
                      <View style={[styles.bar, { height: "60%", backgroundColor: colors.surface + "E6" }]} />
                      <View style={[styles.bar, { height: "20%", backgroundColor: colors.surface + "E6" }]} />
                      <View style={[styles.bar, { height: "50%", backgroundColor: colors.surface + "E6" }]} />
                    </View>
                    <View style={styles.chartLabels}>
                      <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>W1</Text>
                      <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>W2</Text>
                      <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>W3</Text>
                      <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>W4</Text>
                    </View>
                  </>
                )}

                <View style={styles.mockRows}>
                  <View style={[styles.mockRow, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Housing</Text>
                    <Text style={[styles.rowValue, { color: colors.text }]}>$2,100</Text>
                  </View>
                  <View style={[styles.mockRow, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Food</Text>
                    <Text style={[styles.rowValue, { color: colors.text }]}>$850</Text>
                  </View>
                  <View style={[styles.mockRow, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Transport</Text>
                    <Text style={[styles.rowValue, { color: colors.text }]}>$320</Text>
                  </View>
                </View>

              </View>

            </View>

            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Ionicons name="download" size={24} color="#000" />
              <Text style={styles.exportBtnText}>Export Report</Text>
            </TouchableOpacity>

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
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 60 },

  header: { marginBottom: spacing.lg },
  title: { fontSize: 32, fontWeight: "700", fontFamily: "Hanken Grotesk", marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: "Hanken Grotesk" },

  mainLayout: { flexDirection: "column", gap: spacing.lg }, // On tablet could be row

  controlsSection: { gap: spacing.md },
  
  glassPanel: { padding: spacing.md, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: "600", fontFamily: "Hanken Grotesk" },
  
  dateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dateOption: { flexGrow: 1, minWidth: "30%", padding: 12, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)" },
  dateOptionText: { fontSize: 16, fontFamily: "Hanken Grotesk" },

  formatGrid: { flexDirection: "row", gap: 12 },
  formatOption: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.05)" },
  formatOptionText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },

  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  toggleText: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  divider: { height: 1, marginVertical: 8 },

  previewSection: { gap: spacing.md },
  previewPanel: { flex: 1, minHeight: 400 },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  liveBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  liveBadgeText: { fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: "700" },

  mockDoc: { flex: 1, borderRadius: 12, borderWidth: 1, padding: spacing.md, elevation: 10, shadowOffset: { width:0, height:10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  docHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 16, borderBottomWidth: 1, marginBottom: 16 },
  docSub: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 1, marginBottom: 4 },
  docTitle: { fontSize: 28, fontWeight: "600", fontFamily: "Hanken Grotesk" },
  docDate: { fontSize: 12, fontFamily: "JetBrains Mono" },

  miniChart: { height: 120, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8, paddingBottom: 8, borderBottomWidth: 1 },
  bar: { flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginTop: 8 },
  chartLabel: { fontSize: 10, fontFamily: "JetBrains Mono" },

  mockRows: { marginTop: spacing.md, gap: 12 },
  mockRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 8, borderRadius: 6 },
  rowLabel: { fontSize: 12, fontFamily: "JetBrains Mono" },
  rowValue: { fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: "700" },

  exportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 60, borderRadius: 16, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  exportBtnText: { color: "#000", fontSize: 20, fontWeight: "700", fontFamily: "Hanken Grotesk" },
});
