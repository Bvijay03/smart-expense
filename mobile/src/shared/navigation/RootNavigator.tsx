import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { SplashScreen } from "@/modules/authentication/screens/SplashScreen";
import { LoginScreen } from "@/modules/authentication/screens/LoginScreen";
import { RegisterScreen } from "@/modules/authentication/screens/RegisterScreen";
import { AddExpenseScreen } from "@/modules/expenses/screens/AddExpenseScreen";
import { EditExpenseScreen } from "@/modules/expenses/screens/EditExpenseScreen";
import { CreateGroupScreen } from "@/modules/groups/screens/CreateGroupScreen";
import { EditGroupScreen } from "@/modules/groups/screens/EditGroupScreen";
import { GroupDetailScreen } from "@/modules/groups/screens/GroupDetailScreen";
import { AddSharedExpenseScreen } from "@/modules/shared-expenses/screens/AddSharedExpenseScreen";
import { SharedExpenseDetailScreen } from "@/modules/shared-expenses/screens/SharedExpenseDetailScreen";
import { SettlementsScreen } from "@/modules/settlements/screens/SettlementsScreen";
import { BudgetsScreen } from "@/modules/budgets/screens/BudgetsScreen";
import { AddBudgetScreen } from "@/modules/budgets/screens/AddBudgetScreen";
import { NotificationsScreen } from "@/modules/notifications/screens/NotificationsScreen";
import { ProfileScreen } from "@/modules/profile/screens/ProfileScreen";
import { MainTabs } from "./MainTabs";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { AuthStackParamList, RootStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { colors } = useThemeStore();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: "Add Expense" }} />
      <RootStack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: "Edit Expense" }} />
      <RootStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "Create Group" }} />
      <RootStack.Screen name="EditGroup" component={EditGroupScreen} options={{ title: "Edit Group" }} />
      <RootStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: "Group" }} />
      <RootStack.Screen name="SharedExpenseDetail" component={SharedExpenseDetailScreen} options={{ title: "Expense Detail" }} />
      <RootStack.Screen name="AddSharedExpense" component={AddSharedExpenseScreen} options={{ title: "Shared Expense" }} />
      <RootStack.Screen name="Settlements" component={SettlementsScreen} options={{ title: "Settlements" }} />
      <RootStack.Screen name="Budgets" component={BudgetsScreen} options={{ title: "Budgets" }} />
      <RootStack.Screen name="AddBudget" component={AddBudgetScreen} options={{ title: "Set Budget" }} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <RootStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </RootStack.Navigator>
  );
}

export function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { colors, isDark } = useThemeStore();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
