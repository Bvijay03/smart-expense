import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useState, useCallback } from "react";
import { notificationService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export function NotificationsScreen() {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  // We could fetch real notifications here, but to match the spec we'll use mocked data for now to show the glowing states and categories
  const { data: realData, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list().then((r) => r.data.data),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const markAllRead = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadNotifications = realData?.filter(n => !n.read) || [];
  const readNotifications = realData?.filter(n => n.read) || [];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'alert': return 'warning';
      case 'success': return 'wallet';
      case 'info': return 'information-circle';
      case 'payment': return 'cash';
      default: return 'notifications';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'alert': return colors.error;
      case 'success': return colors.success;
      case 'info': return colors.primary;
      case 'payment': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load notifications" onRetry={refetch} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Notifications</Text>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => markAllRead.mutate()}>
          <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerControls}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={[styles.markReadText, { color: colors.primary }]}>MARK ALL READ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {unreadNotifications.length === 0 && readNotifications.length === 0 ? (
            <EmptyState icon="notifications-off-outline" title="No Notifications" message="You have no notifications." />
          ) : unreadNotifications.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginVertical: spacing.md, textAlign: 'center' }}>No new notifications.</Text>
          ) : (
            unreadNotifications.map((notif: any) => {
              const notifColor = getColorForType(notif.type);
              return (
              <TouchableOpacity key={notif.id} style={[styles.glassPanel, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.05)" }]}>
                {/* Unread Indicator Glow */}
                <View style={[styles.unreadIndicator, { backgroundColor: notifColor, shadowColor: notifColor }]} />
                
                <View style={[styles.iconBox, { backgroundColor: notifColor + "33", borderColor: notifColor + "4D" }]}>
                  <Ionicons name={getIconForType(notif.type) as any} size={24} color={notifColor} />
                </View>
                
                <View style={styles.notifBody}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>{notif.title}</Text>
                    <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.notifText, { color: colors.textSecondary }]}>{notif.message || notif.body}</Text>
                </View>
              </TouchableOpacity>
              )
            })
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>EARLIER</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {readNotifications.map((notif: any) => {
            const notifColor = getColorForType(notif.type);
            return (
            <TouchableOpacity key={notif.id} style={[styles.glassPanel, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.05)", opacity: 0.7 }]}>
              <View style={[styles.iconBox, { backgroundColor: notifColor + "33", borderColor: notifColor + "4D" }]}>
                <Ionicons name={getIconForType(notif.type) as any} size={24} color={notifColor} />
              </View>
              
              <View style={styles.notifBody}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>{notif.title}</Text>
                  <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.notifText, { color: colors.textSecondary }]}>{notif.message || notif.body}</Text>
              </View>
            </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.footerAction}>
          <TouchableOpacity style={[styles.viewAllBtn, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.05)" }]}>
            <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>VIEW ALL HISTORY</Text>
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
  scrollContent: { padding: spacing.md, paddingBottom: 100 },

  headerControls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  markReadText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5, fontWeight: "500" },

  list: { gap: spacing.sm },
  glassPanel: { flexDirection: "row", padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "flex-start", gap: 16, position: "relative", overflow: "hidden" },
  unreadIndicator: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
  
  iconBox: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  
  notifBody: { flex: 1 },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  notifTitle: { fontSize: 18, fontWeight: "500", fontFamily: "Hanken Grotesk", flex: 1, marginRight: 8 },
  notifTime: { fontSize: 12, fontFamily: "JetBrains Mono", flexShrink: 0 },
  notifText: { fontSize: 16, fontFamily: "Hanken Grotesk", lineHeight: 22 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 8 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 1.5 },

  footerAction: { alignItems: "center", marginTop: spacing.xl },
  viewAllBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  viewAllText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },
});
