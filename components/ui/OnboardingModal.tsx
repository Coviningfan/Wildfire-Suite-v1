import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView,
} from 'react-native';
import { Calculator, History, Lightbulb, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const SLIDES = [
  {
    icon: <Calculator size={40} color={theme.colors.primary} />,
    title: 'Welcome to Wildfire UV',
    subtitle: 'Professional UV lighting calculations\nat your fingertips.',
    bullets: [
      'Calculate beam coverage & irradiance',
      'Browse 23+ professional fixture database',
      'Save & compare calculations',
      'Scan fixture QR codes instantly',
    ],
  },
  {
    icon: <Calculator size={40} color={theme.colors.primary} />,
    title: 'Calculator Tab',
    subtitle: 'Your main workspace.',
    bullets: [
      'Select a fixture model or scan QR code',
      'Enter throw distance (height + offset)',
      'Tap Calculate for instant results',
      'Save results to your history',
    ],
  },
  {
    icon: <History size={40} color={theme.colors.secondary} />,
    title: 'Calculations Tab',
    subtitle: 'Your saved results library.',
    bullets: [
      'All saved calculations stored here',
      'Search & filter by fixture or safety level',
      'Load any result back into the Calculator',
      'Delete old results you no longer need',
    ],
  },
  {
    icon: <Lightbulb size={40} color={theme.colors.accent} />,
    title: 'Fixtures Tab',
    subtitle: 'Browse the full fixture library.',
    bullets: [
      'Browse all Wildfire UV fixtures',
      'View full photometric specs per fixture',
      'Live beam coverage preview at 3m throw',
      'Select any fixture for calculations',
    ],
  },
  {
    icon: <CheckCircle size={40} color={theme.colors.success} />,
    title: 'The FLAME Formula',
    subtitle: 'Professional UV design in 5 steps.',
    bullets: [
      'F — Fixture: choose the right UV fixture',
      'L — Location: set throw height & distance',
      'A — Angle: match beam to target area',
      'M — Material: UV surfaces peak at 365-370nm',
      'E — Effect: verify irradiance with Calculator',
    ],
  },
];

export function OnboardingModal({ visible, onDismiss }: Props) {
  const [page, setPage] = useState<number>(0);
  const slide = SLIDES[page];
  const isLast = page === SLIDES.length - 1;

  const handleClose = useCallback(() => {
    setPage(0);
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.iconWrap}>{slide.icon}</View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
            <View style={styles.bullets}>
              {slide.bullets.map((b, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bullet}>{b}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnOutline]}
              onPress={page === 0 ? handleClose : () => setPage(p => p - 1)}
              activeOpacity={0.7}
            >
              {page === 0 ? (
                <Text style={styles.navBtnOutlineText}>Skip</Text>
              ) : (
                <>
                  <ChevronLeft size={16} color={theme.colors.text} />
                  <Text style={styles.navBtnOutlineText}>Back</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary]}
              onPress={isLast ? handleClose : () => setPage(p => p + 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.navBtnPrimaryText}>{isLast ? "Let's go!" : 'Next'}</Text>
              {!isLast && <ChevronRight size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
          <View style={{ height: 24 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 24,
    maxHeight: '85%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceElevated,
  },
  dotActive: { backgroundColor: theme.colors.primary, width: 22, borderRadius: 4 },
  content: { alignItems: 'center', paddingBottom: 16 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: theme.colors.text,
    textAlign: 'center' as const,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 22,
    lineHeight: 20,
  },
  bullets: { width: '100%', gap: 10 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 7,
  },
  bullet: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  navBtnOutline: { borderWidth: 1, borderColor: theme.colors.border },
  navBtnOutlineText: { fontSize: 15, fontWeight: '600' as const, color: theme.colors.text },
  navBtnPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navBtnPrimaryText: { fontSize: 15, fontWeight: '600' as const, color: '#fff' },
});
