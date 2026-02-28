import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  userType: 'ADMIN' | 'USER';
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  storeId?: string;
  balanceTaka: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (userData) => set({ isAuthenticated: true, user: userData }),
  logout: () => set({ isAuthenticated: false, user: null }),
}));
