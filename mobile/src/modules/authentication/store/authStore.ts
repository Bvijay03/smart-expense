import { create } from "zustand";
import { User } from "@/shared/types";
import { tokenStorage } from "@/shared/services/tokenStorage";
import { api } from "@/shared/services/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, securityQuestion?: string, securityAnswer?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  getSecurityQuestion: (email: string) => Promise<string>;
  resetPasswordWithSecurity: (email: string, securityAnswer: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  async login(email, password, rememberMe = true) {
    const { data } = await api.post("/auth/login", { email, password });
    const { user, accessToken, refreshToken } = data.data;
    tokenStorage.setRememberMe(rememberMe);
    await tokenStorage.setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true });
  },

  async register(name, email, password, securityQuestion, securityAnswer) {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      securityQuestion,
      securityAnswer,
    });
    const { user, accessToken, refreshToken } = data.data;
    // Default to remember me on register
    tokenStorage.setRememberMe(true);
    await tokenStorage.setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true });
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    await tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  async restoreSession() {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await api.get("/auth/me");
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenStorage.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  async getSecurityQuestion(email: string) {
    const { data } = await api.post("/auth/forgot-password/question", { email });
    return data.data.securityQuestion;
  },

  async resetPasswordWithSecurity(email: string, securityAnswer: string, newPassword: string) {
    await api.post("/auth/forgot-password/reset", { email, securityAnswer, newPassword });
  }
}));
