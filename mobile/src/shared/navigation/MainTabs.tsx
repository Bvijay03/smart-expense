import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { DashboardScreen } from "@/modules/dashboard/screens/DashboardScreen";
import { ExpensesScreen } from "@/modules/expenses/screens/ExpensesScreen";
import { GroupsScreen } from "@/modules/groups/screens/GroupsScreen";
import { AnalyticsScreen } from "@/modules/analytics/screens/AnalyticsScreen";
import { ProfileScreen } from "@/modules/profile/screens/ProfileScreen";
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
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 24,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: colors.surface,
          borderRadius: 32,
          height: 64,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1,
          shadowRadius: 15,
        },
        tabBarIcon: ({ size, focused }) => {
          const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
            Dashboard:     ["home",         "home-outline"],
            Expenses:      ["receipt",      "receipt-outline"],
            Groups:        ["people",       "people-outline"],
            Analytics:     ["bar-chart",    "bar-chart-outline"],
            Profile:       ["person",       "person-outline"],
          };
          const [active, inactive] = icons[route.name] ?? ["ellipse", "ellipse-outline"];
          const iconName = focused ? active : inactive;
          const color = focused ? colors.primary : colors.textSecondary;

          const renderIcon = () => {
            return <Ionicons name={iconName} size={24} color={color} />;
          };

          return (
            <View style={{ alignItems: "center", justifyContent: "center", marginTop: 12 }}>
              {renderIcon()}
              {focused && (
                <View style={{
                  marginTop: 6,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 6,
                  elevation: 5,
                }} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
