export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Groups: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen: keyof MainTabParamList } | undefined;
  AddExpense: undefined;
  EditExpense: { expenseId: string; amount: number; category: string; expenseDate: string; notes: string | null };
  CreateGroup: undefined;
  EditGroup: { groupId: string; name: string; description: string | null };
  GroupDetail: { groupId: string; groupName: string };
  SharedExpenseDetail: { expenseId: string; groupId: string };
  AddSharedExpense: { groupId: string; members: { id: string; name: string }[]; prefill?: { amount: string; category: string; description: string; expenseDate: string; } };
  Settlements: { groupId: string; groupName: string };
  Budgets: undefined;
  AddBudget: undefined;
  Notifications: undefined;
  Profile: undefined;
  Friends: undefined;
  Settings: undefined;
  GroupExpenses: { groupId: string; groupName: string };
  MemberActivity: { groupId: string; groupName: string; memberId: string; memberName: string };
  Categories: undefined;
  Recurring: undefined;
  Search: undefined;
};
