import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { LogIn, Fingerprint, Apple } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { PoweredBy } from '@/components/ui/PoweredBy';
import { useAuthStore } from '@/stores/auth-store';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAppleAuthAvailable } from '@/utils/apple-auth';
import { isBiometricAvailable, getBiometricType } from '@/utils/biometric-auth';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, loginWithApple, loginWithBiometric, isLoading, biometricEnabled, user } = useAuthStore();
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  useEffect(() => {
    checkAuthMethods();
  }, []);

  const checkAuthMethods = async () => {
    const appleOk = await isAppleAuthAvailable();
    setAppleAvailable(appleOk);
    const bioOk = await isBiometricAvailable();
    setBiometricAvailable(bioOk);
    if (bioOk) {
      const type = await getBiometricType();
      setBiometricType(type);
    }
    console.log('[Login] Apple:', appleOk, 'Biometric:', bioOk);
  };

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    const success = await login(email, password);
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  }, [email, password, login]);

  const handleDemoLogin = useCallback(async () => {
    const success = await login('demo@example.com', 'password123');
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    } else {
      Alert.alert('Demo Login Failed', 'Please try again');
    }
  }, [login]);

  const handleAppleLogin = useCallback(async () => {
    const success = await loginWithApple();
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    }
  }, [loginWithApple]);

  const handleBiometricLogin = useCallback(async () => {
    if (!biometricEnabled || !user) {
      Alert.alert('Biometric Login', 'Enable biometric login in your Profile settings after signing in.');
      return;
    }
    const success = await loginWithBiometric();
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    } else {
      Alert.alert('Authentication Failed', 'Biometric authentication failed. Please sign in with your credentials.');
    }
  }, [loginWithBiometric, biometricEnabled, user]);

  const showBiometric = biometricAvailable && biometricEnabled && user != null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Logo size="medium" />
          </View>

          <Card style={styles.card}>
            <View style={styles.titleContainer}>
              <View style={styles.iconCircle}>
                <LogIn size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              showPasswordToggle
            />

            <View style={styles.buttonSection}>
              <Button title="Sign In" onPress={handleLogin} loading={isLoading} variant="primary" size="large" />
            </View>

            {(appleAvailable || showBiometric) && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  {appleAvailable && (
                    <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin} activeOpacity={0.7}>
                      <Apple size={20} color={theme.colors.text} />
                      <Text style={styles.socialBtnText}>Apple</Text>
                    </TouchableOpacity>
                  )}
                  {showBiometric && (
                    <TouchableOpacity style={styles.socialBtn} onPress={handleBiometricLogin} activeOpacity={0.7}>
                      <Fingerprint size={20} color={theme.colors.accent} />
                      <Text style={styles.socialBtnText}>{biometricType}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {!appleAvailable && !showBiometric && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Button title="Quick Demo Login" onPress={handleDemoLogin} variant="outline" size="medium" />
              </>
            )}

            {(appleAvailable || showBiometric) && (
              <View style={styles.demoRow}>
                <Button title="Quick Demo Login" onPress={handleDemoLogin} variant="outline" size="small" />
              </View>
            )}

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <Link href={'/(auth)/register' as any} asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Card>

          <PoweredBy />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  header: { alignItems: 'center', marginBottom: 28 },
  card: { marginHorizontal: 0 },
  titleContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.1)',
  },
  title: { fontSize: 24, fontWeight: '700' as const, color: theme.colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  buttonSection: { marginTop: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  dividerText: { paddingHorizontal: 14, color: theme.colors.textTertiary, fontSize: 12, fontWeight: '500' as const },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  socialBtnText: { fontSize: 14, fontWeight: '600' as const, color: theme.colors.text },
  demoRow: { marginTop: 12 },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  linkText: { fontSize: 14, color: theme.colors.textSecondary },
  link: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' as const },
});
