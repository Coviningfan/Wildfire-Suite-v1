import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role?: string;
  authProvider?: 'local' | 'apple';
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

/**
 * Map a Supabase auth user + optional profile row into the app's User shape.
 * The `profile` argument comes from the `profiles` table (may be null for
 * brand-new accounts where the trigger hasn't run yet or the query failed).
 */
function toAppUser(
  su: SupabaseUser,
  profile?: { name?: string | null; role?: string | null } | null,
): User {
  const meta = su.user_metadata ?? {};
  return {
    id: su.id,
    name: profile?.name ?? meta.full_name ?? meta.name ?? su.email ?? 'User',
    email: su.email ?? '',
    createdAt: su.created_at,
    role: profile?.role ?? meta.role ?? 'user',
    authProvider: (meta.provider === 'apple' ? 'apple' : 'local') as
      | 'local'
      | 'apple',
  };
}

/** Fetch the profiles row for a given user id (best-effort, never throws). */
async function fetchProfile(
  uid: string,
): Promise<{ name?: string | null; role?: string | null } | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', uid)
      .single();
    return data;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      biometricEnabled: false,

      // ─── Email / password login ───────────────────────────────────────────
      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error || !data.user) {
            set({ isLoading: false });
            return false;
          }
          const profile = await fetchProfile(data.user.id);
          const appUser = toAppUser(data.user, profile);
          set({
            user: appUser,
            isAuthenticated: true,
            isAdmin: appUser.role === 'admin',
            isLoading: false,
          });
          return true;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      // ─── Apple Sign-In ────────────────────────────────────────────────────
      loginWithApple: async (): Promise<boolean> => {
        set({ isLoading: true });
        try {
          const { identityToken, fullName } = await import(
            '@/utils/apple-auth'
          ).then((m) => m.signInWithApple());

          if (!identityToken) {
            set({ isLoading: false });
            return false;
          }

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: identityToken,
          });

          if (error || !data.user) {
            set({ isLoading: false });
            return false;
          }

          // Update display name in metadata if Apple provided it
          if (fullName?.givenName) {
            await supabase.auth.updateUser({
              data: {
                full_name: `${fullName.givenName} ${fullName.familyName ?? ''}`.trim(),
              },
            });
          }

          const profile = await fetchProfile(data.user.id);
          const appUser = toAppUser(data.user, profile);
          set({
            user: appUser,
            isAuthenticated: true,
            isAdmin: appUser.role === 'admin',
            isLoading: false,
          });
          return true;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      // ─── Biometric (re-uses persisted session) ────────────────────────────
      loginWithBiometric: async (): Promise<boolean> => {
        const { user } = get();
        if (!user) return false;
        // Biometric just re-authenticates the already-persisted user;
        // the Supabase session is already restored via AsyncStorage.
        set({ isAuthenticated: true });
        return true;
      },

      // ─── Registration ─────────────────────────────────────────────────────
      register: async (
        name: string,
        email: string,
        password: string,
      ): Promise<boolean> => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
          });
          if (error || !data.user) {
            set({ isLoading: false });
            return false;
          }
          const profile = await fetchProfile(data.user.id);
          const appUser = toAppUser(data.user, profile);
          set({
            user: appUser,
            isAuthenticated: true,
            isAdmin: false,
            isLoading: false,
          });
          return true;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      // ─── Logout ───────────────────────────────────────────────────────────
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isAdmin: false });
      },

      // ─── Session init (called once on app start) ──────────────────────────
      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            const appUser = toAppUser(session.user, profile);
            set({
              user: appUser,
              isAuthenticated: true,
              isAdmin: appUser.role === 'admin',
              isLoading: false,
            });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setBiometricEnabled: (enabled: boolean) =>
        set({ biometricEnabled: enabled }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist loading state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        biometricEnabled: state.biometricEnabled,
      }),
    },
  ),
);
