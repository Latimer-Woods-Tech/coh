import { create } from 'zustand';
import { authApi } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone?: string;
  avatar?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => {
  // Load from localStorage on init
  const savedToken = localStorage.getItem('authToken');
  const savedUser = localStorage.getItem('user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    isLoading: false,
    error: null,

    signup: async (email: string, password: string, name: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authApi.signup({ email, password, name }) as unknown as AuthResponse;
        const { token, user } = response;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user, isLoading: false });
      } catch (error: any) {
        const errorMessage = error?.message || 'Signup failed';
        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authApi.login({ email, password }) as unknown as AuthResponse;
        const { token, user } = response;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user, isLoading: false });
      } catch (error: any) {
        const errorMessage = error?.message || 'Login failed';
        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await authApi.logout();
      } catch (error) {
        // Continue logout even if API call fails
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      set({ user: null, token: null, isLoading: false });
    },

    refreshProfile: async () => {
      set({ isLoading: true, error: null });
      try {
        const user = await authApi.getProfile() as unknown as User;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoading: false });
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to refresh profile';
        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    updateProfile: async (data: { name?: string; phone?: string; avatar?: string }) => {
      set({ isLoading: true, error: null });
      try {
        const user = await authApi.updateProfile(data) as unknown as User;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoading: false });
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to update profile';
        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    setUser: (user: User | null) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      set({ user });
    },

    setToken: (token: string | null) => {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
      set({ token });
    },
  };
});
