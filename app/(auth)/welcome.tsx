import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { ChevronRight, Apple } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { isAppleAuthAvailable } from '@/utils/apple-auth';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(24)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const { loginWithApple, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    checkApple();
  }, []);

  const checkApple = async () => {
    const available = await isAppleAuthAvailable();
    setAppleAvailable(available);
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await loginWithApple();
    if (success) {
      router.replace('/(tabs)/(home)' as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} />
      <Animated.View style={[styles.bgGlowInner, { opacity: glowPulse }]} />

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.hero}>
          <Animated.View style={[styles.logoWrap, { opacity: logoFade, transform: [{ scale: logoScale }] }]}>
            <Logo size="large" imageOnly />
          </Animated.View>

          <Animated.View style={{ opacity: textFade, transform: [{ translateY: textSlide }] }}>
            <Text style={styles.title}>UV Radiometric{'\n'}Calculator</Text>
            <Text style={styles.subtitle}>Professional-grade UV analysis{'\n'}for Wildfire fixtures.</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.actions, { opacity: buttonFade, transform: [{ translateY: buttonSlide }], paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/login' as any);
            }}
            activeOpacity={0.85}
            testID="welcome-get-started"
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push('/(auth)/register' as any)}
              activeOpacity={0.7}
              testID="welcome-create-account"
            >
              <Text style={styles.outlineBtnText}>Create Account</Text>
            </TouchableOpacity>

            {appleAvailable && (
              <TouchableOpacity
                style={styles.appleBtn}
                onPress={handleAppleSignIn}
                activeOpacity={0.7}
                disabled={isLoading}
                testID="welcome-apple-sign-in"
              >
                <Apple size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.footer}>
            by <Text style={styles.footerBrand}>JABVLabs</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080A',
  },
  bgGlow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(232, 65, 42, 0.06)',
  },
  bgGlowInner: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    marginLeft: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(232, 65, 42, 0.08)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#F4F4F5',
    textAlign: 'center' as const,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: '#71717A',
    textAlign: 'center' as const,
    marginTop: 14,
    lineHeight: 23,
  },
  actions: {
    paddingHorizontal: 28,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E8412A',
    shadowColor: '#E8412A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  outlineBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#D4D4D8',
  },
  appleBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    fontSize: 11,
    color: '#3F3F46',
    textAlign: 'center' as const,
    marginTop: 20,
    letterSpacing: 0.3,
  },
  footerBrand: {
    color: '#E8412A',
    fontWeight: '600' as const,
  },
});
