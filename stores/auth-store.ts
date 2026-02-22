import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  loginWithBiometric: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => void;
  setBiometricEnabled: (enabled: boolean) => void;
}

const localUsers: Array<{
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}> = [
  {
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    password: "password123",
    role: "user",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

const getUsersFromStorage = async (): Promise<typeof localUsers> => {
  try {
    const stored = await AsyncStorage.getItem('local-users');
    return stored ? JSON.parse(stored) : localUsers;
  } catch {
    return localUsers;
  }
};

const saveUsersToStorage = async (users: typeof localUsers): Promise<void> => {
  try {
    await AsyncStorage.setItem('local-users', JSON.stringify(users));
  } catch (error) {
    console.log('Failed to save users:', error);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      biometricEnabled: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const users = await getUsersFromStorage();
          const user = users.find(u => u.email === email && u.password === password);
          if (user) {
            const isAdmin = user.role === 'admin';
            const { password: _pw, ...userWithoutPassword } = user;
            set({ user: userWithoutPassword, isAuthenticated: true, isAdmin, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.log('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      loginWithApple: async () => {
        set({ isLoading: true });
        try {
          const { signInWithApple } = await import('@/utils/apple-auth');
          const result = await signInWithApple();
          if (result.success && result.user) {
            const users = await getUsersFromStorage();
            let existingUser = users.find(u => u.email === result.user!.email);
            if (!existingUser) {
              existingUser = {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                password: '',
                role: 'user',
                createdAt: new Date().toISOString(),
              };
              await saveUsersToStorage([...users, existingUser]);
            }
            const { password: _pw, ...userWithoutPassword } = existingUser;
            set({ user: userWithoutPassword, isAuthenticated: true, isAdmin: false, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.log('Apple login error:', error);
          set({ isLoading: false });
          return false;
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
        } catch (error) {
          console.log('Biometric login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const users = await getUsersFromStorage();
          if (users.find(u => u.email === email)) {
            set({ isLoading: false });
            return false;
          }
          const newUser = {
            id: (users.length + 1).toString(),
            name,
            email,
            password,
            role: "user",
            createdAt: new Date().toISOString(),
          };
          await saveUsersToStorage([...users, newUser]);
          const { password: _pw, ...userWithoutPassword } = newUser;
          set({ user: userWithoutPassword, isAuthenticated: true, isAdmin: false, isLoading: false });
          return true;
        } catch (error) {
          console.log('Registration error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, isAdmin: false });
      },

      setBiometricEnabled: (enabled: boolean) => {
        set({ biometricEnabled: enabled });
      },

      initializeAuth: () => {
        const state = get();
        if (state.user) {
          set({ isAuthenticated: true, isAdmin: state.user.role === 'admin' });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);
