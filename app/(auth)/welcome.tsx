import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { theme } from '@/constants/theme';
import { Zap, Shield, ScanLine, BarChart3, ChevronRight, Apple } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { isAppleAuthAvailable } from '@/utils/apple-auth';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: Zap, color: '#E8412A', label: 'Instant Calculations', desc: 'Beam coverage & irradiance' },
  { icon: BarChart3, color: '#F5A623', label: '23+ Fixtures', desc: 'Professional UV database' },
  { icon: Shield, color: '#22C55E', label: 'Safety Levels', desc: 'Real-time assessments' },
  { icon: ScanLine, color: '#7C6BF0', label: 'QR Scanning', desc: 'Instant fixture lookup' },
];

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-20)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;
  const [appleAvailable, setAppleAvailable] = useState<boolean>(false);
  const { loginWithApple, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.stagger(80, featureAnims.map(anim =>
        Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true })
      )),
      Animated.parallel([
        Animated.timing(buttonFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(buttonSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

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
      <LinearGradient
        colors={['#0A0A0D', '#0F0F14', '#0A0A0D']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.bgAccent1} />
      <View style={styles.bgAccent2} />
      <View style={styles.bgLine1} />
      <View style={styles.bgLine2} />

      <View style={{ height: insets.top + 10 }} />

      <View style={styles.topSection}>
        <Animated.View style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: logoSlide }] }]}>
          <Logo size="large" showTagline />
        </Animated.View>

        <Animated.View style={[styles.headingArea, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
          <View style={styles.versionBadge}>
            <View style={styles.versionDot} />
            <Text style={styles.versionText}>PRO UV TOOL</Text>
          </View>
          <Text style={styles.heading}>Radiometric{'\n'}Calculator</Text>
          <Text style={styles.subheading}>
            Precision beam coverage, irradiance, and safety data for Wildfire UV fixtures.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.featuresSection}>
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <Animated.View
              key={feat.label}
              style={[
                styles.featureCard,
                {
                  opacity: featureAnims[i],
                  transform: [{
                    translateX: featureAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: feat.color + '14' }]}>
                <Icon size={17} color={feat.color} strokeWidth={2.2} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureLabel}>{feat.label}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View style={[styles.bottomSection, { opacity: buttonFade, transform: [{ translateY: buttonSlide }], paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(auth)/login' as any);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(auth)/register' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          {appleAvailable && (
            <TouchableOpacity
              style={styles.appleBtn}
              onPress={handleAppleSignIn}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Apple size={16} color="#fff" />
              <Text style={styles.appleBtnText}>Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footerText}>
          Powered by <Text style={styles.footerBrand}>JABVLabs</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0D',
  },

  bgAccent1: {
    position: 'absolute',
    top: height * 0.08,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232, 65, 42, 0.04)',
  },
  bgAccent2: {
    position: 'absolute',
    bottom: height * 0.25,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 107, 240, 0.03)',
  },
  bgLine1: {
    position: 'absolute',
    top: height * 0.18,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bgLine2: {
    position: 'absolute',
    top: height * 0.55,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  topSection: {
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  logoArea: {
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headingArea: {
    marginBottom: 8,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    backgroundColor: 'rgba(232, 65, 42, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  versionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E8412A',
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#E8412A',
    letterSpacing: 1.8,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: '#F4F4F5',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subheading: {
    fontSize: 15,
    color: '#A1A1AA',
    lineHeight: 22,
    marginTop: 12,
    maxWidth: width * 0.85,
  },
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(22, 22, 28, 0.8)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F4F4F5',
    letterSpacing: -0.1,
  },
  featureDesc: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 16,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.1,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(22, 22, 28, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#F4F4F5',
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  appleBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  footerText: {
    fontSize: 11,
    color: '#52525B',
    textAlign: 'center' as const,
    marginTop: 18,
    letterSpacing: 0.3,
  },
  footerBrand: {
    color: '#E8412A',
    fontWeight: '600' as const,
  },
});
