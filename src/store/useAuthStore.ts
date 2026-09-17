import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TenantDto {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  tenantName?: string;
  tenantId?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  globalToken: string | null;
  user: User | null;
  availableTenants: TenantDto[];
  setAuth: (token: string, refreshToken: string, user: User) => void;
  setGlobalAuth: (globalToken: string, user: User, tenants: TenantDto[]) => void;
  logout: () => void;
  updateToken: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      globalToken: null,
      user: null,
      availableTenants: [],
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      setGlobalAuth: (globalToken, user, availableTenants) => set({ globalToken, user, availableTenants, token: null, refreshToken: null }),
      updateToken: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ token: null, refreshToken: null, globalToken: null, user: null, availableTenants: [] }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
