import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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

    login: async (_email: string, _password: string) => {
      set({ isLoading: true });
      try {
        // TODO: Call API endpoint
        // const response = await apiClient.post('/auth/login', { email, password });
        // const { token, user } = response.data;
        // localStorage.setItem('authToken', token);
        // localStorage.setItem('user', JSON.stringify(user));
        // set({ token, user, isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      set({ user: null, token: null });
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
