import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { DashboardScreen } from "@/modules/dashboard/screens/DashboardScreen";
import { ExpensesScreen } from "@/modules/expenses/screens/ExpensesScreen";
import { GroupsScreen } from "@/modules/groups/screens/GroupsScreen";
import { AnalyticsScreen } from "@/modules/analytics/screens/AnalyticsScreen";
import { NotificationsScreen } from "@/modules/notifications/screens/NotificationsScreen";
import { notificationService } from "@/shared/services/modules";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { colors } = useThemeStore();

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list().then((r) => r.data.data),
    refetchInterval: 30000, // refresh every 30s
  });
  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
            Dashboard:     ["home",         "home-outline"],
            Expenses:      ["receipt",      "receipt-outline"],
            Groups:        ["people",       "people-outline"],
            Analytics:     ["bar-chart",    "bar-chart-outline"],
            Notifications: ["notifications","notifications-outline"],
          };
          const [active, inactive] = icons[route.name] ?? ["ellipse", "ellipse-outline"];
          const iconName = focused ? active : inactive;

          if (route.name === "Notifications") {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                {unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                  </View>
                )}
              </View>
            );
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: "Alerts" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
});
