import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Fingerprint, LogIn } from 'lucide-react-native';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isBiometricAvailable, getBiometricType } from '@/utils/biometric-auth';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const colors = useThemeColors();
  const { login, loginWithBiometric, isLoading, biometricEnabled, user } = useAuthStore();
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
    const bioOk = await isBiometricAvailable();
    setBiometricAvailable(bioOk);
    if (bioOk) {
      const type = await getBiometricType();
      setBiometricType(type);
    }
  };

  const handleSignIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    login();
  }, [login]);

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
      Alert.alert('Authentication Failed', 'Biometric authentication failed. Please sign in again.');
    }
  }, [loginWithBiometric, biometricEnabled, user]);

  const showBiometric = biometricAvailable && biometricEnabled && user != null;
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.bgAccent} />

      <SafeAreaView style={styles.safeArea}>
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

        <View style={styles.centerContent}>
          <Animated.View style={[styles.formArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Sign in with your Google, GitHub, Apple, or email account
            </Text>

            <TouchableOpacity
              style={styles.signInBtn}
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <LogIn size={20} color="#fff" />
              <Text style={styles.signInBtnText}>{isLoading ? 'Redirecting...' : 'Sign In'}</Text>
            </TouchableOpacity>

            {showBiometric && (
              <View style={styles.altSection}>
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                <TouchableOpacity
                  style={[styles.biometricBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={handleBiometricLogin}
                  activeOpacity={0.7}
                >
                  <Fingerprint size={18} color={colors.accent} />
                  <Text style={[styles.biometricBtnText, { color: colors.text }]}>{biometricType}</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              No separate account needed — use any of the providers above to get started instantly.
            </Text>
          </Animated.View>
        </View>
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
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingBottom: 60,
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
      lineHeight: 23,
    },
    signInBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 54,
      borderRadius: 15,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
    },
    signInBtnText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#fff',
      letterSpacing: 0.1,
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
    biometricBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      height: 50,
      borderRadius: 14,
      borderWidth: 1,
    },
    biometricBtnText: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    infoText: {
      fontSize: 13,
      textAlign: 'center' as const,
      marginTop: 28,
      lineHeight: 19,
    },
  });
}
