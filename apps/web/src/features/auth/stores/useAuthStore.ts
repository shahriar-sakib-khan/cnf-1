import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  userType: 'ADMIN' | 'USER';
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  tenantId?: string;
  balanceTaka: number;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true, // Start as loading during initial mount check
  user: null,
  login: (userData) => set({ isAuthenticated: true, user: userData, isLoading: false }),
  logout: () => set({ isAuthenticated: false, user: null, isLoading: false }),
  updateUser: (userData) => set((state) => ({
    user: state.user ? { ...state.user, ...userData } : (userData as User)
  })),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
