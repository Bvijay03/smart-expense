export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Groups: undefined;
  Analytics: undefined;
  Notifications: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddExpense: undefined;
  EditExpense: { expenseId: string; amount: number; category: string; expenseDate: string; notes: string | null };
  CreateGroup: undefined;
  EditGroup: { groupId: string; name: string; description: string | null };
  GroupDetail: { groupId: string; groupName: string };
  SharedExpenseDetail: { expenseId: string; groupId: string };
  AddSharedExpense: { groupId: string; members: { id: string; name: string }[] };
  Settlements: { groupId: string; groupName: string };
  Budgets: undefined;
  AddBudget: undefined;
  Notifications: undefined;
  Profile: undefined;
  GroupExpenses: { groupId: string; groupName: string };
  Categories: undefined;
  Recurring: undefined;
};
