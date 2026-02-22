import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { User, LogOut, BookOpen, Flame, ChevronRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { PoweredBy } from '@/components/ui/PoweredBy';
import { OnboardingModal } from '@/components/ui/OnboardingModal';
import { useAuthStore } from '@/stores/auth-store';
import { useLightingStore } from '@/stores/lighting-store';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { savedCalculations } = useLightingStore();
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome' as any); } },
    ]);
  }, [logout]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OnboardingModal visible={showTutorial} onDismiss={() => setShowTutorial(false)} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Logo size="medium" />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{savedCalculations.length}</Text>
              <Text style={styles.statLabel}>Calculations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>Fixtures</Text>
            </View>
          </View>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Account</Text>
          <InfoRow label="Name" value={user?.name ?? 'Not available'} />
          <InfoRow label="Email" value={user?.email ?? 'Not available'} />
          <InfoRow
            label="Member Since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
            isLast
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Help & Tutorial</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowTutorial(true)} activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <BookOpen size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>App Tutorial</Text>
              <Text style={styles.menuSub}>Learn how to use all features</Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>FLAME Formula Reference</Text>
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
        </Card>

        <View style={styles.logoutContainer}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            size="large"
            icon={<LogOut size={18} color={theme.colors.text} />}
          />
        </View>

        <PoweredBy />
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

const FLAME_COLORS = [
  '#E8412A',
  '#7C6BF0',
  '#F5A623',
  '#22C55E',
  '#3B82F6',
];

const FLAME_ITEMS = [
  { letter: 'F', title: 'Fixture', desc: 'Choose the right UV fixture for your application' },
  { letter: 'L', title: 'Location', desc: 'Set mounting height & horizontal throw distance' },
  { letter: 'A', title: 'Angle', desc: 'Match beam angle to your target coverage area' },
  { letter: 'M', title: 'Material', desc: 'UV-reactive surfaces peak at 365-370 nm' },
  { letter: 'E', title: 'Effect', desc: 'Verify irradiance meets your design requirement' },
];

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: { fontSize: 14, color: theme.colors.textSecondary },
  value: { fontSize: 14, color: theme.colors.text, fontWeight: '500' as const },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  scrollContent: { paddingBottom: Platform.select({ ios: 20, android: 100, default: 20 }) },
  header: { alignItems: 'center', padding: 20, paddingTop: 14, paddingBottom: 8 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, paddingBottom: 24 },
  avatarRing: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    ...theme.shadows.glow,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '800' as const, color: theme.colors.primary },
  userName: { fontSize: 22, fontWeight: '700' as const, color: theme.colors.text, letterSpacing: -0.3 },
  userEmail: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 3 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '800' as const, color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '500' as const, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 32, backgroundColor: theme.colors.border, marginHorizontal: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text, marginBottom: 10, letterSpacing: -0.1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center', alignItems: 'center',
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600' as const, color: theme.colors.text },
  menuSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  flameRow: { flexDirection: 'row', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  flameRowLast: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  flameBadge: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  flameLetter: { fontSize: 14, fontWeight: '800' as const, color: '#fff' },
  flameContent: { flex: 1 },
  flameTitle: { fontSize: 14, fontWeight: '700' as const, color: theme.colors.text },
  flameDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2, lineHeight: 17 },
  logoutContainer: { paddingHorizontal: 16, paddingVertical: 16 },
});
