import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, Switch, Animated, Easing, Linking } from 'react-native';
import { router } from 'expo-router';
import { User, LogOut, ChevronRight, Fingerprint, FileDown, Shield, Sparkles, Calculator, Lightbulb, Flame, Award, Mail, Phone, Globe, MapPin, Ruler, Moon, Sun } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

import { useAuthStore } from '@/stores/auth-store';
import { useLightingStore } from '@/stores/lighting-store';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isBiometricAvailable, getBiometricType } from '@/utils/biometric-auth';
import { exportCalculationAsCSV } from '@/utils/file-helpers';
import { useSettingsStore } from '@/stores/settings-store';

const AnimatedSection = React.memo(({ children, index }: { children: React.ReactNode; index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, delay, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
});

export default function ProfileScreen() {
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuthStore();
  const { savedCalculations } = useLightingStore();
  const { unitSystem, toggleUnitSystem, themeMode, toggleThemeMode } = useSettingsStore();

  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(avatarScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(avatarOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [avatarScale, avatarOpacity]);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
    }
  };

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome' as any); } },
    ]);
  }, [logout]);

  const handleToggleBiometric = useCallback((value: boolean) => {
    if (value) {
      Alert.alert(
        `Enable ${biometricType}`,
        `Use ${biometricType} for quick sign-in next time?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => setBiometricEnabled(true) },
        ],
      );
    } else {
      setBiometricEnabled(false);
    }
  }, [biometricType, setBiometricEnabled]);

  const handleExportAll = useCallback(async () => {
    if (savedCalculations.length === 0) {
      Alert.alert('No Data', 'No saved calculations to export.');
      return;
    }
    setIsExporting(true);
    try {
      const result = await exportCalculationAsCSV(
        savedCalculations.map(c => ({
          name: c.name,
          fixture: c.fixture,
          timestamp: c.timestamp,
          safetyLevel: c.safetyLevel,
          inputs: c.inputs,
          result: c.result as Record<string, any>,
        }))
      );
      if (result.success) {
        Alert.alert('Exported', 'All calculations exported as CSV.');
      } else {
        Alert.alert('Error', result.error ?? 'Export failed.');
      }
    } catch {
      Alert.alert('Error', 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [savedCalculations]);

  const handleOpenUrl = useCallback(async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const WB = await import('expo-web-browser');
        await WB.openBrowserAsync(url);
      }
    } catch {
      Linking.openURL(url);
    }
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  const safeCount = savedCalculations.filter(c => c.safetyLevel === 'safe').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedSection index={0}>
          <View style={styles.profileSection}>
            <Animated.View style={[styles.avatarOuter, { transform: [{ scale: avatarScale }], opacity: avatarOpacity }]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </Animated.View>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: theme.colors.glow }]}>
                <Calculator size={15} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{savedCalculations.length}</Text>
              <Text style={styles.statLabel}>Calculations</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(124, 107, 240, 0.12)' }]}>
                <Lightbulb size={15} color={theme.colors.accent} />
              </View>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>Fixtures</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                <Shield size={15} color={theme.colors.success} />
              </View>
              <Text style={styles.statValue}>{safeCount}</Text>
              <Text style={styles.statLabel}>Safe</Text>
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.menuCard}>
              <InfoRow label="Name" value={user?.name ?? 'N/A'} />
              <InfoRow label="Email" value={user?.email ?? 'N/A'} />
              <InfoRow
                label="Member Since"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                isLast
              />
            </View>
          </View>
        </AnimatedSection>

        {Platform.OS !== 'web' && biometricAvailable && (
          <AnimatedSection index={3}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>SECURITY</Text>
              <View style={styles.menuCard}>
                <View style={styles.biometricRow}>
                  <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(124, 107, 240, 0.12)' }]}>
                    <Fingerprint size={16} color={theme.colors.accent} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{biometricType} Login</Text>
                    <Text style={styles.menuItemSub}>Quick sign-in</Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleToggleBiometric}
                    trackColor={{ false: theme.colors.surfaceElevated, true: theme.colors.primary + '80' }}
                    thumbColor={biometricEnabled ? theme.colors.primary : theme.colors.textTertiary}
                  />
                </View>
              </View>
            </View>
          </AnimatedSection>
        )}

        <AnimatedSection index={4}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>PREFERENCES</Text>
            <View style={styles.menuCard}>
              <View style={styles.biometricRow}>
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Ruler size={16} color={theme.colors.focus} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Unit System</Text>
                  <Text style={styles.menuItemSub}>{unitSystem === 'metric' ? 'Metric (m, m²)' : 'Imperial (ft, ft²)'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.unitToggle}
                  onPress={() => { Haptics.selectionAsync(); toggleUnitSystem(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.unitToggleText}>{unitSystem === 'metric' ? 'M' : 'FT'}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.biometricRow, { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }]}>
                <View style={[styles.menuItemIcon, { backgroundColor: themeMode === 'dark' ? 'rgba(124, 107, 240, 0.12)' : 'rgba(245, 166, 35, 0.12)' }]}>
                  {themeMode === 'dark' ? <Moon size={16} color={theme.colors.accent} /> : <Sun size={16} color={theme.colors.secondary} />}
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Appearance</Text>
                  <Text style={styles.menuItemSub}>{themeMode === 'dark' ? 'Dark mode' : 'Light mode'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.unitToggle}
                  onPress={() => { Haptics.selectionAsync(); toggleThemeMode(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.unitToggleText}>{themeMode === 'dark' ? '🌙' : '☀️'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={5}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>ACTIONS</Text>
            <View style={styles.menuCard}>
              <MenuItem
                icon={<FileDown size={16} color={theme.colors.success} />}
                iconBg="rgba(34, 197, 94, 0.12)"
                title="Export All Calculations"
                subtitle={`CSV · ${savedCalculations.length} records`}
                onPress={handleExportAll}
                isLast
              />
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={6}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>CONTACT & SUPPORT</Text>
            <View style={styles.menuCard}>
              <MenuItem
                icon={<Mail size={16} color={theme.colors.primary} />}
                iconBg={theme.colors.glow}
                title="Email Support"
                subtitle="info@wildfirefx.com"
                onPress={() => Linking.openURL('mailto:info@wildfirefx.com')}
              />
              <MenuItem
                icon={<Phone size={16} color={theme.colors.success} />}
                iconBg="rgba(34, 197, 94, 0.12)"
                title="Call Us"
                subtitle="+1 (818) 846-1650"
                onPress={() => Linking.openURL('tel:+18188461650')}
              />
              <MenuItem
                icon={<Globe size={16} color={theme.colors.focus} />}
                iconBg="rgba(59, 130, 246, 0.12)"
                title="Website"
                subtitle="wildfirelighting.com"
                onPress={() => handleOpenUrl('https://wildfirelighting.com')}
              />
              <MenuItem
                icon={<MapPin size={16} color={theme.colors.secondary} />}
                iconBg="rgba(245, 166, 35, 0.12)"
                title="Location"
                subtitle="Burbank, CA, USA"
                onPress={() => {}}
                isLast
              />
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={7}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>FLAME FORMULA</Text>
            <View style={styles.menuCard}>
              {FLAME_ITEMS.map(({ letter, title, desc }, index) => (
                <View key={letter} style={[styles.flameRow, index === FLAME_ITEMS.length - 1 && styles.flameRowLast]}>
                  <View style={[styles.flameBadge, { backgroundColor: FLAME_COLORS[index] }]}>
                    <Text style={styles.flameLetter}>{letter}</Text>
                  </View>
                  <View style={styles.flameContent}>
                    <Text style={styles.flameTitle}>{title}</Text>
                    <Text style={styles.flameDesc}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </AnimatedSection>

        <AnimatedSection index={8}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={16} color={theme.colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Logo size="small" imageOnly />
            <Text style={styles.footerVersion}>v1.0.0 · Powered by JABVLabs</Text>
          </View>
        </AnimatedSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[infoStyles.row, isLast === true && infoStyles.rowLast]}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function MenuItem({ icon, iconBg, title, subtitle, onPress, isLast }: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle: string;
  onPress: () => void; isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[menuStyles.item, isLast === true && menuStyles.itemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[menuStyles.iconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={menuStyles.text}>
        <Text style={menuStyles.title}>{title}</Text>
        <Text style={menuStyles.sub}>{subtitle}</Text>
      </View>
      <ChevronRight size={16} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );
}

const FLAME_COLORS = ['#E8412A', '#7C6BF0', '#F5A623', '#22C55E', '#3B82F6'];
const FLAME_ITEMS = [
  { letter: 'F', title: 'Fixture', desc: 'Choose the right UV fixture' },
  { letter: 'L', title: 'Location', desc: 'Set mounting height & throw' },
  { letter: 'A', title: 'Angle', desc: 'Match beam to coverage area' },
  { letter: 'M', title: 'Material', desc: 'UV-reactive at 365-370nm' },
  { letter: 'E', title: 'Effect', desc: 'Verify irradiance requirement' },
];

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 14, color: theme.colors.textSecondary },
  value: { fontSize: 14, color: theme.colors.text, fontWeight: '500' as const },
});

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  itemLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' as const, color: theme.colors.text },
  sub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  scrollContent: { paddingBottom: Platform.select({ ios: 30, android: 110, default: 30 }) },
  profileSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 22,
  },
  avatarOuter: {
    width: 82,
    height: 82,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: theme.colors.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: theme.colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: 15, fontWeight: '600' as const, color: theme.colors.text },
  menuItemSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  unitToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.glow,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.25)',
  },
  unitToggleText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  flameRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  flameRowLast: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  flameBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameLetter: { fontSize: 13, fontWeight: '800' as const, color: '#fff' },
  flameContent: { flex: 1 },
  flameTitle: { fontSize: 14, fontWeight: '700' as const, color: theme.colors.text },
  flameDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: theme.colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
    gap: 8,
  },
  footerVersion: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
});
