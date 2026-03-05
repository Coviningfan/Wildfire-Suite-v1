import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function getApiBase(): string {
  if (Platform.OS !== 'web') return '';
  const host = window.location.hostname;
  const proto = window.location.protocol;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return `${proto}//${host.replace(/\.replit\.dev$/, '-3001.replit.dev').replace(/\.repl\.co$/, '-3001.repl.co')}`;
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  login: () => void;
  loginWithBiometric: () => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      biometricEnabled: false,

      login: () => {
        if (Platform.OS === 'web') {
          window.location.href = `${getApiBase()}/api/login`;
        }
      },

      loginWithBiometric: async () => {
        const state = get();
        if (!state.biometricEnabled || !state.user) {
          return false;
        }
        set({ isLoading: true });
        try {
          const { authenticateWithBiometric } = await import('@/utils/biometric-auth');
          const result = await authenticateWithBiometric('Sign in to Wildfire');
          if (result.success) {
            set({ isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        if (Platform.OS === 'web') {
          window.location.href = `${getApiBase()}/api/logout`;
        }
      },

      setBiometricEnabled: (enabled: boolean) => {
        set({ biometricEnabled: enabled });
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${getApiBase()}/api/auth/user`, {
            credentials: 'include',
          });
          if (response.ok) {
            const user: User = await response.json();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);
