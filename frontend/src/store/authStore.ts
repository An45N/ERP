import { create } from "zustand";
import { api } from "../lib/api";
import type { User, AuthResponse, LoginCredentials } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      const { user, token } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Login failed";
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  },
}));
