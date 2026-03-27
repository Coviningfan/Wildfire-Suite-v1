import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { ArrowLeft, Fingerprint, Apple } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { OnboardingModal } from '@/components/ui/OnboardingModal';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAppleAuthAvailable } from '@/utils/apple-auth';
import { isBiometricAvailable, getBiometricType } from '@/utils/biometric-auth';
import * as Haptics from 'expo-haptics';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

export default function LoginScreen() {
  const colors = useThemeColors();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, loginWithApple, loginWithBiometric, isLoading, biometricEnabled, user } = useAuthStore();
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [isFirstLaunch, markSeen] = useFirstLaunch();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [pendingDemoLogin, setPendingDemoLogin] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    checkAuthMethods();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: false }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isFirstLaunch) {
      setShowOnboarding(true);
    }
  }, [isFirstLaunch]);

  const checkAuthMethods = async () => {
    const appleOk = await isAppleAuthAvailable();
    setAppleAvailable(appleOk);
    const bioOk = await isBiometricAvailable();
    setBiometricAvailable(bioOk);
    if (bioOk) {
      const type = await getBiometricType();
      setBiometricType(type);
    }
    if (__DEV__) {
      console.log('[Login] Apple:', appleOk, 'Biometric:', bioOk);
    }
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

  const executeDemoLogin = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await login(DEMO_EMAIL, DEMO_PASSWORD);
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    } else {
      Alert.alert('Demo Login Failed', 'Please try again');
    }
  }, [login]);

  const handleDemoLogin = useCallback(() => {
    if (showOnboarding) {
      setPendingDemoLogin(true);
    } else {
      executeDemoLogin();
    }
  }, [showOnboarding, executeDemoLogin]);

  const handleDismissOnboarding = useCallback(() => {
    const shouldRunDemoLogin = pendingDemoLogin;
    setPendingDemoLogin(false);
    setShowOnboarding(false);
    if (isFirstLaunch) {
      markSeen();
    }
    if (shouldRunDemoLogin) {
      executeDemoLogin();
    }
  }, [pendingDemoLogin, isFirstLaunch, markSeen, executeDemoLogin]);

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
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <OnboardingModal visible={showOnboarding} onDismiss={handleDismissOnboarding} />
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
              <ArrowLeft size={20} color={colors.text} />
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
              <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Sign in to continue</Text>

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
                style={[styles.demoBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                onPress={handleDemoLogin}
                activeOpacity={0.7}
              >
                <Text style={[styles.demoBtnText, { color: colors.textSecondary }]}>Try Demo Account</Text>
              </TouchableOpacity>

              {(appleAvailable || showBiometric) && (
                <View style={styles.altSection}>
                  <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  </View>

                  <View style={styles.altRow}>
                    {appleAvailable && (
                      <TouchableOpacity style={[styles.altBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleAppleLogin} activeOpacity={0.7}>
                        <Apple size={18} color={colors.text} />
                        <Text style={[styles.altBtnText, { color: colors.text }]}>Apple</Text>
                      </TouchableOpacity>
                    )}
                    {showBiometric && (
                      <TouchableOpacity style={[styles.altBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleBiometricLogin} activeOpacity={0.7}>
                        <Fingerprint size={18} color={colors.accent} />
                        <Text style={[styles.altBtnText, { color: colors.text }]}>{biometricType}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.linkRow}>
                <Text style={[styles.linkText, { color: colors.textTertiary }]}>Don't have an account? </Text>
                <Link href={'/(auth)/register' as any} asChild>
                  <TouchableOpacity>
                    <Text style={[styles.link, { color: colors.primary }]}>Sign Up</Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bgAccent: {
      position: 'absolute',
      top: -50,
      right: -80,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.glow,
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
      backgroundColor: colors.surface,
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
      letterSpacing: -0.8,
    },
    subtitle: {
      fontSize: 16,
      marginTop: 6,
      marginBottom: 32,
    },
    formFields: {
      marginBottom: 8,
    },
    signInBtn: {
      height: 54,
      borderRadius: 15,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
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
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    demoBtnText: {
      fontSize: 14,
      fontWeight: '600' as const,
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
    },
    dividerText: {
      paddingHorizontal: 14,
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
    },
    altBtnText: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 28,
    },
    linkText: {
      fontSize: 14,
    },
    link: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
  });
}
