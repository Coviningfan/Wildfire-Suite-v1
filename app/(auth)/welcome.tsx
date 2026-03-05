import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/ui/Logo';
import { ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import * as Haptics from 'expo-haptics';

export default function WelcomeScreen() {
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(24)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  const { login } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(logoScale, { toValue: 1, duration: 600, useNativeDriver: false }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(textSlide, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]).start();
    }, 500);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(buttonSlide, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
    }, 900);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.7, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 2000, useNativeDriver: false }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    login();
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
            onPress={handleSignIn}
            activeOpacity={0.85}
            testID="welcome-get-started"
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
            <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.authNote}>
            Sign in with Google, GitHub, Apple, or email
          </Text>

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
  authNote: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center' as const,
    marginTop: 14,
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
