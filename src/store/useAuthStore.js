import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setStoredUser,
  clearAccessToken,
  clearStoredUser,
} from "@/utils/storage";
import { logout as logoutService } from "@/services/auth.service";

function computeIsAuthenticated(user, token) {
  return Boolean(token) && Boolean(user);
}

const initialUser = getStoredUser();
const initialToken = getAccessToken();

export const useAuthStore = create(
  persist(
    (set) => ({
      user: initialUser,
      token: initialToken,
      isAuthenticated: computeIsAuthenticated(initialUser, initialToken),

      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      setAuth: (user, token) => {
        if (token) setAccessToken(token);
        if (user) setStoredUser(user);

        set({
          user,
          token,
          isAuthenticated: computeIsAuthenticated(user, token),
        });
      },

      updateUser: (user) => {
        setStoredUser(user);
        set((state) => ({
          user,
          isAuthenticated: computeIsAuthenticated(user, state.token),
        }));
      },

      clearAuth: () => {
        clearAccessToken();
        clearStoredUser();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null, isAuthenticated: false });
      },

      logout: async () => {
        await logoutService();
        clearAccessToken();
        clearStoredUser();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "unilife_dashboard_auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
