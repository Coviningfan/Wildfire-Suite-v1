import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { PoweredBy } from '@/components/ui/PoweredBy';
import { theme } from '@/constants/theme';
import { Ruler, Lightbulb, ShieldCheck, ScanLine } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <LinearGradient
      colors={['#0D0D10', '#12121A', '#0D0D10']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <View style={styles.glowBg} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={styles.heroGlow}>
            <View style={styles.glowRing}>
              <View style={styles.glowInner}>
                <Logo size="large" showTagline />
              </View>
            </View>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PROFESSIONAL UV TOOL</Text>
          </View>
          <Text style={styles.title}>Radiometric Data{'\n'}Calculator</Text>
          <Text style={styles.subtitle}>
            Calculate beam coverage, irradiance, and safety levels for Wildfire Lighting UV fixtures.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon={<Ruler size={18} color={theme.colors.primary} />} text="Instant beam & irradiance calculations" />
          <FeatureItem icon={<Lightbulb size={18} color={theme.colors.secondary} />} text="23+ professional fixture database" />
          <FeatureItem icon={<ShieldCheck size={18} color={theme.colors.success} />} text="Safety level assessments" />
          <FeatureItem icon={<ScanLine size={18} color={theme.colors.accent} />} text="QR code fixture scanning" />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/login' as any)}
            variant="primary"
            size="large"
          />
          <Button
            title="Create Account"
            onPress={() => router.push('/(auth)/register' as any)}
            variant="outline"
            size="large"
          />
        </View>

        <PoweredBy />
      </Animated.View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>{icon}</View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowBg: {
    position: 'absolute',
    top: height * 0.05,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(232, 65, 42, 0.06)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: height * 0.08,
  },
  header: {
    alignItems: 'center',
  },
  heroGlow: {
    marginBottom: 24,
  },
  glowRing: {
    padding: 3,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.08)',
  },
  glowInner: {
    padding: 16,
  },
  badge: {
    backgroundColor: 'rgba(232, 65, 42, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: theme.colors.text,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  features: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(22, 22, 26, 0.9)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { fontSize: 14, color: theme.colors.text, flex: 1, fontWeight: '500' as const },
  buttonContainer: {
    gap: 10,
  },
});
