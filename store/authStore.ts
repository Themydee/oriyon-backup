import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  role: "trainee" | "trainer" | "lead_trainer" | "admin" | "coordinator" | "state_coordinator" | "zonal_coordinator" | "lga_coordinator" | "cooperative";
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  passportPicture?: string;
  idDocumentUrl?: string;
  isCooperativeOnly?: boolean;
  specialization?: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) => set({ user }),

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  logout: () => {
    localStorage.removeItem("refreshToken");
    set({ accessToken: null, user: null });
  },
}));