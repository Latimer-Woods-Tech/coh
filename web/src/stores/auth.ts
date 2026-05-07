import { create } from 'zustand';
import { authApi } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin' | 'practitioner';
  phone?: string;
  avatar?: string;
}

interface AuthResponse {
  user: User;
}

interface ProfileResponse {
  user: User;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>(() => {
  // User profile is non-sensitive — safe to cache in localStorage for UI continuity.
  // Auth state is managed by the HttpOnly authToken cookie (set by the server).
  const savedUser = localStorage.getItem('user');

  return {
    user: savedUser ? (JSON.parse(savedUser) as User) : null,
    isLoading: false,
    error: null,

    signup: async (email: string, password: string, name: string) => {
      useAuthStore.setState({ isLoading: true, error: null });
      try {
        const response = await authApi.signup({ email, password, name }) as unknown as AuthResponse;
        const { user } = response;
        localStorage.setItem('user', JSON.stringify(user));
        useAuthStore.setState({ user, isLoading: false });
      } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || 'Signup failed';
        useAuthStore.setState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    login: async (email: string, password: string) => {
      useAuthStore.setState({ isLoading: true, error: null });
      try {
        const response = await authApi.login({ email, password }) as unknown as AuthResponse;
        const { user } = response;
        localStorage.setItem('user', JSON.stringify(user));
        useAuthStore.setState({ user, isLoading: false });
      } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || 'Login failed';
        useAuthStore.setState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    logout: async () => {
      useAuthStore.setState({ isLoading: true });
      try {
        await authApi.logout();
      } catch {
        // Continue logout even if API call fails
      }
      localStorage.removeItem('user');
      useAuthStore.setState({ user: null, isLoading: false });
    },

    refreshProfile: async () => {
      useAuthStore.setState({ isLoading: true, error: null });
      try {
        const response = await authApi.getProfile() as unknown as ProfileResponse;
        const { user } = response;
        localStorage.setItem('user', JSON.stringify(user));
        useAuthStore.setState({ user, isLoading: false });
      } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || 'Failed to refresh profile';
        useAuthStore.setState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    updateProfile: async (data: { name?: string; phone?: string; avatar?: string }) => {
      useAuthStore.setState({ isLoading: true, error: null });
      try {
        const response = await authApi.updateProfile(data) as unknown as ProfileResponse;
        const { user } = response;
        localStorage.setItem('user', JSON.stringify(user));
        useAuthStore.setState({ user, isLoading: false });
      } catch (error: unknown) {
        const errorMessage = (error as { message?: string })?.message || 'Failed to update profile';
        useAuthStore.setState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    setUser: (user: User | null) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      useAuthStore.setState({ user });
    },
  };
});
