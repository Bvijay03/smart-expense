import { api } from "@/shared/services/api";
import {
  Expense,
  PaginatedResponse,
  Budget,
  Group,
  SharedExpense,
  Balance,
  Settlement,
  Notification,
} from "@/shared/types";

export const expenseService = {
  list(params?: Record<string, unknown>) {
    return api.get<{ data: PaginatedResponse<Expense> }>("/expenses", {
      params,
    });
  },
  create(data: Record<string, unknown>) {
    return api.post<{ data: Expense }>("/expenses", data);
  },
  update(id: string, data: Record<string, unknown>) {
    return api.patch<{ data: Expense }>(`/expenses/${id}`, data);
  },
  delete(id: string) {
    return api.delete(`/expenses/${id}`);
  },
  moveToGroup(id: string, groupId: string, description?: string) {
    return api.post(`/expenses/${id}/move-to-group`, { groupId, description });
  },
  exportCsv() {
    return api.get<string>("/expenses/export");
  },
};

export const groupService = {
  list() {
    return api.get<{ data: Group[] }>("/groups");
  },
  get(id: string) {
    return api.get<{ data: Group }>(`/groups/${id}`);
  },
  create(data: { name: string; description?: string }) {
    return api.post<{ data: Group }>("/groups", data);
  },
  delete(groupId: string) {
    return api.delete(`/groups/${groupId}`);
  },
  update(groupId: string, data: { name?: string; description?: string }) {
    return api.patch<{ data: Group }>(`/groups/${groupId}`, data);
  },
  addMember(groupId: string, name: string, email?: string) {
    const body: { name: string; email?: string } = { name };
    if (email) body.email = email;
    return api.post(`/groups/${groupId}/members`, body);
  },
  removeMember(groupId: string, memberId: string) {
    return api.delete(`/groups/${groupId}/members/${memberId}`);
  },
  generateInviteCode(groupId: string) {
    return api.post<{ data: { inviteCode: string; expiresAt: string } }>(
      `/groups/${groupId}/invite-code`
    );
  },
  joinByCode(inviteCode: string) {
    return api.post<{ data: { id: string; groupId: string; groupName: string; status: string } }>(
      "/groups/join",
      { inviteCode }
    );
  },
  listJoinRequests(groupId: string) {
    return api.get<{ data: any[] }>(`/groups/${groupId}/join-requests`);
  },
  handleJoinRequest(groupId: string, requestId: string, action: "approve" | "reject") {
    return api.patch(`/groups/${groupId}/join-requests/${requestId}`, { action });
  },
};

export const sharedExpenseService = {
  list(groupId: string) {
    return api.get<{ data: SharedExpense[] }>(
      `/groups/${groupId}/expenses`,
    );
  },
  create(groupId: string, data: Record<string, unknown>) {
    return api.post<{ data: SharedExpense }>(
      `/groups/${groupId}/expenses`,
      data,
    );
  },
  delete(groupId: string, id: string) {
    return api.delete(`/groups/${groupId}/expenses/${id}`);
  },
};

export const settlementService = {
  balances(groupId: string) {
    return api.get<{ data: Balance[] }>(
      `/groups/${groupId}/settlements/balances`,
    );
  },
  list(groupId: string) {
    return api.get<{ data: Settlement[] }>(
      `/groups/${groupId}/settlements`,
    );
  },
  markSettled(id: string) {
    return api.patch<{ data: Settlement }>(`/settlements/${id}`);
  },
  settleWithAmount(id: string, amount: number) {
    return api.post(`/settlements/${id}/settle`, { amount });
  },
};

export const budgetService = {
  list(params?: { month?: number; year?: number }) {
    return api.get<{ data: Budget[] }>("/budgets", { params });
  },
  create(data: Record<string, unknown>) {
    return api.post<{ data: Budget }>("/budgets", data);
  },
  update(id: string, amount: number) {
    return api.patch<{ data: Budget }>(`/budgets/${id}`, { amount });
  },
  delete(id: string) {
    return api.delete(`/budgets/${id}`);
  },
};

export const analyticsService = {
  summary(params?: Record<string, unknown>) {
    return api.get("/analytics/summary", { params });
  },
  byCategory(params?: Record<string, unknown>) {
    return api.get("/analytics/by-category", { params });
  },
  trends(params?: Record<string, unknown>) {
    return api.get("/analytics/trends", { params });
  },
};

export const notificationService = {
  list() {
    return api.get<{ data: Notification[] }>("/notifications");
  },
  markRead(id: string) {
    return api.patch(`/notifications/${id}/read`);
  },
  markAllRead() {
    return api.patch("/notifications/read-all");
  },
};

export const categoryService = {
  list() {
    return api.get<{ data: { id: string; name: string; icon: string; color: string; isDefault: boolean }[] }>("/categories");
  },
  create(data: { name: string; icon?: string; color?: string }) {
    return api.post("/categories", data);
  },
  delete(id: string) {
    return api.delete(`/categories/${id}`);
  },
};

export const recurringService = {
  list() {
    return api.get<{ data: any[] }>("/recurring");
  },
  create(data: Record<string, unknown>) {
    return api.post("/recurring", data);
  },
  update(id: string, data: Record<string, unknown>) {
    return api.patch(`/recurring/${id}`, data);
  },
  delete(id: string) {
    return api.delete(`/recurring/${id}`);
  },
  toggleActive(id: string) {
    return api.patch(`/recurring/${id}/toggle`);
  },
};
