export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  inviteCode: string | null;
  inviteCodeExp: string | null;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
  expenseCount?: number;
  userContribution?: number;
  userNetBalance?: number;
}

export interface GroupMember {
  id: string;
  role: string;
  joinedAt: string;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  balance?: {
    paid: number;
    owed: number;
    net: number;
  };
  owesTo?: { userId: string; name: string; amount: number }[];
  getsFrom?: { userId: string; name: string; amount: number }[];
}

export interface SharedExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE";
  paidBy: Pick<User, "id" | "name" | "email">;
  splits: {
    userId: string;
    amountOwed: number;
    user: Pick<User, "id" | "name" | "email">;
  }[];
}

export interface Balance {
  userId: string;
  name: string;
  paid: number;
  owed: number;
  net: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: "PENDING" | "SETTLED";
  settledAt: string | null;
  fromUser: Pick<User, "id" | "name" | "email">;
  toUser: Pick<User, "id" | "name" | "email">;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  spent?: number;
  remaining?: number;
  percentUsed?: number;
  isOverBudget?: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: { code: string; message: string };
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
}
