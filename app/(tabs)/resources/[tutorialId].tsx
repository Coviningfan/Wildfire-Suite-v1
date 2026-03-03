import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Linking, Alert, Animated, PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft, ExternalLink, BookOpen,
  Atom, Zap, Lightbulb, Flame, Cpu, Camera,
  ChevronLeft, ChevronRight, Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { TUTORIALS } from '@/constants/tutorials';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Atom, Zap, Lightbulb, Flame, Cpu, Camera, BookOpen,
};

export default function TutorialDetailScreen() {
  const { tutorialId } = useLocalSearchParams<{ tutorialId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tutorial = TUTORIALS.find(t => t.id === tutorialId);
  const [currentStep, setCurrentStep] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentStepRef = useRef(currentStep);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  const totalStepsRef = useRef(tutorial?.sections.length ?? 0);

  const animateToStep = useCallback((nextStep: number, direction: 1 | -1) => {
    Haptics.selectionAsync();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -28 * direction, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(28 * direction);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const goNextRef = useRef<() => void>(() => {});
  const goPrevRef = useRef<() => void>(() => {});

  useEffect(() => {
    goNextRef.current = () => {
      const step = currentStepRef.current;
      const total = totalStepsRef.current;
      if (step < total - 1) animateToStep(step + 1, 1);
    };
    goPrevRef.current = () => {
      const step = currentStepRef.current;
      if (step > 0) animateToStep(step - 1, -1);
    };
  }, [animateToStep]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 12 && Math.abs(dy) < 40,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -50) goNextRef.current();
        else if (dx > 50) goPrevRef.current();
      },
    })
  ).current;

  const handleOpenPdf = useCallback(async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const WebBrowser = await import('expo-web-browser');
        await WebBrowser.openBrowserAsync(url);
      }
    } catch {
      try { await Linking.openURL(url); }
      catch { Alert.alert('Open Link', `Visit: ${url}`); }
    }
  }, []);

  if (!tutorial) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Tutorial not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const IconComponent = ICON_MAP[tutorial.icon] ?? BookOpen;
  const section = tutorial.sections[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tutorial.sections.length - 1;
  const progress = (currentStep + 1) / tutorial.sections.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>{tutorial.title}</Text>
          <Text style={styles.navStepText}>
            Step {currentStep + 1} of {tutorial.sections.length}
          </Text>
        </View>

        {tutorial.pdfUrl ? (
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={() => handleOpenPdf(tutorial.pdfUrl!)}
            activeOpacity={0.7}
          >
            <ExternalLink size={13} color={colors.primary} />
            <Text style={styles.pdfBtnText}>PDF</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: `${progress * 100}%`, backgroundColor: tutorial.color },
          ]}
        />
      </View>

      <View style={styles.dotsRow}>
        {tutorial.sections.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              if (idx !== currentStep)
                animateToStep(idx, idx > currentStep ? 1 : -1);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          >
            <View
              style={[
                styles.dot,
                idx === currentStep && [styles.dotActive, { backgroundColor: tutorial.color }],
                idx < currentStep && { backgroundColor: tutorial.color + '50' },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View
        style={[styles.stepWrap, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.stepIconWrap, { backgroundColor: tutorial.color + '14' }]}>
          <IconComponent size={26} color={tutorial.color} />
        </View>
        <View style={[styles.stepNumBadge, { backgroundColor: tutorial.color + '16' }]}>
          <Text style={[styles.stepNumText, { color: tutorial.color }]}>
            Step {currentStep + 1}
          </Text>
        </View>
        <Text style={styles.stepTitle}>
          {section.heading ?? section.title}
        </Text>
        <Text style={styles.stepBody}>
          {section.body ?? section.content}
        </Text>
      </Animated.View>

      <View style={styles.navButtons}>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnSecondary, isFirst && styles.navBtnDisabled]}
          onPress={() => goNextRef.current && goPrevRef.current()}
          disabled={isFirst}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={isFirst ? colors.textTertiary : colors.text} />
          <Text style={[styles.navBtnSecText, isFirst && { color: colors.textTertiary }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navBtn,
            styles.navBtnPrimary,
            { backgroundColor: isLast ? colors.success : tutorial.color },
          ]}
          onPress={isLast ? () => router.back() : () => goNextRef.current()}
          activeOpacity={0.85}
        >
          {isLast ? (
            <>
              <Check size={16} color="#fff" />
              <Text style={styles.navBtnPrimaryText}>Done</Text>
            </>
          ) : (
            <>
              <Text style={styles.navBtnPrimaryText}>Next</Text>
              <ChevronRight size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    navBar: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 10,
    },
    navBackBtn: {
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: colors.surface,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    navCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
    navTitle: {
      fontSize: 13, fontWeight: '700' as const,
      color: colors.text, letterSpacing: -0.2,
    },
    navStepText: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
    pdfBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 11, paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.glow,
      borderWidth: 1, borderColor: 'rgba(232, 65, 42, 0.2)',
      width: 60, justifyContent: 'center',
    },
    pdfBtnText: { fontSize: 12, fontWeight: '600' as const, color: colors.primary },
    progressBarBg: {
      height: 3,
      backgroundColor: colors.border,
      marginHorizontal: 16,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: { height: 3, borderRadius: 2 },
    dotsRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 5,
      paddingVertical: 14,
    },
    dot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: colors.border,
    },
    dotActive: { width: 18, borderRadius: 3 },
    stepWrap: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 12,
    },
    stepIconWrap: {
      width: 52, height: 52, borderRadius: 16,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 16,
    },
    stepNumBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 8, marginBottom: 12,
    },
    stepNumText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.4 },
    stepTitle: {
      fontSize: 24, fontWeight: '800' as const,
      color: colors.text, letterSpacing: -0.5,
      marginBottom: 16, lineHeight: 30,
    },
    stepBody: {
      fontSize: 16, color: colors.textSecondary,
      lineHeight: 26,
    },
    navButtons: {
      flexDirection: 'row', gap: 10,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 16 : 20,
      paddingTop: 10,
    },
    navBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 6, height: 52, borderRadius: 14,
    },
    navBtnSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
    },
    navBtnPrimary: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
    },
    navBtnDisabled: { opacity: 0.35 },
    navBtnSecText: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
    navBtnPrimaryText: { fontSize: 15, fontWeight: '700' as const, color: '#fff' },
    notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    notFoundText: { fontSize: 16, color: colors.textSecondary },
    backBtn: {
      paddingHorizontal: 20, paddingVertical: 10,
      borderRadius: 10, backgroundColor: colors.surface,
    },
    backBtnText: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  });
}
