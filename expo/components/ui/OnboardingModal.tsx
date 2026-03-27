import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Calculator,
  History,
  Lightbulb,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
}

export function OnboardingModal({ visible, onDismiss }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [page, setPage] = useState<number>(0);

  const slides = useMemo<OnboardingSlide[]>(() => [
    {
      icon: <Sparkles size={40} color={colors.primary} />,
      title: 'Welcome to Wildfire Suite',
      subtitle: 'A quick hands-on tutorial to run your first UV design in minutes.',
      bullets: [
        'Follow this once to learn the full app flow',
        'Reopen learning content in Resources anytime',
        'Use this sequence for customer demos',
      ],
    },
    {
      icon: <Calculator size={40} color={colors.primary} />,
      title: 'Step 1 · Calculator (FLAME)',
      subtitle: 'Build one complete result from top to bottom.',
      bullets: [
        'F: choose a fixture model',
        'L + A: set location and target beam area',
        'M + E: pick material and desired effect',
        'Tap Calculate to generate irradiance and safety levels',
      ],
    },
    {
      icon: <Lightbulb size={40} color={colors.accent} />,
      title: 'Step 2 · Room Simulation',
      subtitle: 'Visualize placement and coverage like a real venue setup.',
      bullets: [
        'Switch views: TOP, SIDE, 3D',
        'Switch surfaces: floor, walls, ceiling',
        'Use heatmap + drag fixtures for quick layout tuning',
        'Read MAX/AVG/SAFETY/COVER to validate design quality',
      ],
    },
    {
      icon: <History size={40} color={colors.secondary} />,
      title: 'Step 3 · Save, Recall, Compare',
      subtitle: 'Turn one-off calculations into reusable project presets.',
      bullets: [
        'Save each scenario with clear names',
        'Re-open from history during customer reviews',
        'Compare multiple fixture strategies side by side',
      ],
    },
    {
      icon: <CheckCircle size={40} color={colors.success} />,
      title: 'Step 4 · Present with Confidence',
      subtitle: 'Your repeatable customer demo flow is now ready.',
      bullets: [
        'Open with a Calculator result',
        'Show Room Simulation transitions and controls',
        'Close with saved scenario + AI insight recommendation',
      ],
    },
  ], [colors]);

  const slide = slides[page] ?? slides[0];
  const isLast = page === slides.length - 1;

  useEffect(() => {
    console.log('[OnboardingModal] visible:', visible, 'page:', page);
  }, [visible, page]);

  const handleClose = useCallback(() => {
    console.log('[OnboardingModal] closing modal and resetting page');
    setPage(0);
    onDismiss();
  }, [onDismiss]);

  const handleBack = useCallback(() => {
    if (page === 0) {
      handleClose();
      return;
    }
    setPage((prev) => Math.max(0, prev - 1));
  }, [handleClose, page]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleClose();
      return;
    }
    setPage((prev) => Math.min(slides.length - 1, prev + 1));
  }, [handleClose, isLast, slides.length]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay} testID="onboarding-modal-overlay">
        <View style={styles.sheet} testID="onboarding-modal-sheet">
          <View style={styles.dots} testID="onboarding-progress-dots">
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} testID={`onboarding-dot-${i}`} />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} testID="onboarding-content-scroll">
            <View style={styles.iconWrap} testID="onboarding-slide-icon">{slide.icon}</View>
            <Text style={styles.title} testID="onboarding-slide-title">{slide.title}</Text>
            <Text style={styles.subtitle} testID="onboarding-slide-subtitle">{slide.subtitle}</Text>
            <View style={styles.bullets} testID="onboarding-slide-bullets">
              {slide.bullets.map((bullet, i) => (
                <View key={i} style={styles.bulletRow} testID={`onboarding-bullet-row-${i}`}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bullet}>{bullet}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.navRow} testID="onboarding-nav-row">
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnOutline]}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={page === 0 ? 'Skip onboarding' : 'Previous onboarding step'}
              testID="onboarding-back-button"
            >
              {page === 0 ? (
                <Text style={styles.navBtnOutlineText}>Skip</Text>
              ) : (
                <>
                  <ChevronLeft size={16} color={colors.text} />
                  <Text style={styles.navBtnOutlineText}>Back</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary]}
              onPress={handleNext}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Finish onboarding' : 'Next onboarding step'}
              testID="onboarding-next-button"
            >
              <Text style={styles.navBtnPrimaryText}>{isLast ? 'Start Using App' : 'Next'}</Text>
              {!isLast && <ChevronRight size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
          <View style={styles.bottomSpacer} />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.background,
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
      backgroundColor: colors.surfaceElevated,
    },
    dotActive: { backgroundColor: colors.primary, width: 22, borderRadius: 4 },
    content: { alignItems: 'center', paddingBottom: 16 },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 22,
      fontWeight: '800' as const,
      color: colors.text,
      textAlign: 'center' as const,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
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
      backgroundColor: colors.primary,
      marginTop: 7,
    },
    bullet: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
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
    navBtnOutline: { borderWidth: 1, borderColor: colors.border },
    navBtnOutlineText: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
    navBtnPrimary: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    navBtnPrimaryText: { fontSize: 15, fontWeight: '600' as const, color: '#fff' },
    bottomSpacer: { height: 24 },
  });
}
