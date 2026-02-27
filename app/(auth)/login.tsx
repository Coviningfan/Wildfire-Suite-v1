import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { ArrowLeft, Fingerprint, Apple } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/stores/auth-store';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAppleAuthAvailable } from '@/utils/apple-auth';
import { isBiometricAvailable, getBiometricType } from '@/utils/biometric-auth';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, loginWithApple, loginWithBiometric, isLoading, biometricEnabled, user } = useAuthStore();
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    checkAuthMethods();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await login(email, password);
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  }, [email, password, login]);

  const handleDemoLogin = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await login('demo@example.com', 'password123');
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    } else {
      Alert.alert('Demo Login Failed', 'Please try again');
    }
  }, [login]);

  const handleAppleLogin = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await loginWithBiometric();
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    } else {
      Alert.alert('Authentication Failed', 'Biometric authentication failed. Please sign in with your credentials.');
    }
  }, [loginWithBiometric, biometricEnabled, user]);

  const showBiometric = biometricAvailable && biometricEnabled && user != null;
  const canSubmit = email.length > 0 && password.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.bgAccent} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Logo size="small" imageOnly />
            <View style={styles.backBtn} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.formArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              <View style={styles.formFields}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
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
              </View>

              <TouchableOpacity
                style={[styles.signInBtn, !canSubmit && styles.signInBtnDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading || !canSubmit}
              >
                <Text style={styles.signInBtnText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={handleDemoLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.demoBtnText}>Try Demo Account</Text>
              </TouchableOpacity>

              {(appleAvailable || showBiometric) && (
                <View style={styles.altSection}>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.altRow}>
                    {appleAvailable && (
                      <TouchableOpacity style={styles.altBtn} onPress={handleAppleLogin} activeOpacity={0.7}>
                        <Apple size={18} color={theme.colors.text} />
                        <Text style={styles.altBtnText}>Apple</Text>
                      </TouchableOpacity>
                    )}
                    {showBiometric && (
                      <TouchableOpacity style={styles.altBtn} onPress={handleBiometricLogin} activeOpacity={0.7}>
                        <Fingerprint size={18} color={theme.colors.accent} />
                        <Text style={styles.altBtnText}>{biometricType}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.linkRow}>
                <Text style={styles.linkText}>Don't have an account? </Text>
                <Link href={'/(auth)/register' as any} asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0D',
  },
  bgAccent: {
    position: 'absolute',
    top: -50,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(232, 65, 42, 0.03)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  formArea: {},
  title: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: '#F4F4F5',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: '#71717A',
    marginTop: 6,
    marginBottom: 32,
  },
  formFields: {
    marginBottom: 8,
  },
  signInBtn: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#E8412A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E8412A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  signInBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.1,
  },
  demoBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(22, 22, 28, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#A1A1AA',
  },
  altSection: {
    marginTop: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dividerText: {
    paddingHorizontal: 14,
    color: '#52525B',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  altRow: {
    flexDirection: 'row',
    gap: 10,
  },
  altBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(22, 22, 28, 0.6)',
  },
  altBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F4F4F5',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  linkText: {
    fontSize: 14,
    color: '#71717A',
  },
  link: {
    fontSize: 14,
    color: '#E8412A',
    fontWeight: '600' as const,
  },
});
