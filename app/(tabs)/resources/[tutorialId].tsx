import React, { useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Linking, Alert, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import {
  ArrowLeft, ExternalLink, ChevronDown, BookOpen,
  Atom, Zap, Lightbulb, Flame, Cpu, Camera,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';
import { TUTORIALS, Tutorial } from '@/constants/tutorials';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Atom, Zap, Lightbulb, Flame, Cpu, Camera, BookOpen,
};

export default function TutorialDetailScreen() {
  const { tutorialId } = useLocalSearchParams<{ tutorialId: string }>();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const tutorial = TUTORIALS.find((t) => t.id === tutorialId);

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
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Open Link', `Visit: ${url}`);
      }
    }
  }, []);

  if (!tutorial) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Tutorial not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const IconComponent = ICON_MAP[tutorial.icon] ?? BookOpen;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.stickyHeaderInner}>
          <Text style={styles.stickyTitle} numberOfLines={1}>{tutorial.title}</Text>
        </View>
      </Animated.View>

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
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        {tutorial.pdfUrl && (
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={() => handleOpenPdf(tutorial.pdfUrl!)}
            activeOpacity={0.7}
          >
            <ExternalLink size={15} color={theme.colors.primary} />
            <Text style={styles.pdfBtnText}>PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: tutorial.color + '18' }]}>
            <IconComponent size={28} color={tutorial.color} />
          </View>
          <Text style={styles.heroTitle}>{tutorial.title}</Text>
          <Text style={styles.heroSubtitle}>{tutorial.subtitle}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.metaBadge, { backgroundColor: tutorial.color + '14' }]}>
              <Text style={[styles.metaBadgeText, { color: tutorial.color }]}>{tutorial.readTime} read</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{tutorial.sections.length} sections</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {tutorial.sections.map((section, idx) => (
          <View key={idx} style={styles.sectionCard}>
            <View style={styles.sectionNumberWrap}>
              <Text style={[styles.sectionNumber, { color: tutorial.color }]}>{idx + 1}</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          </View>
        ))}

        {tutorial.pdfUrl && (
          <TouchableOpacity
            style={styles.fullPdfLink}
            onPress={() => handleOpenPdf(tutorial.pdfUrl!)}
            activeOpacity={0.7}
          >
            <ExternalLink size={16} color={theme.colors.primary} />
            <Text style={styles.fullPdfText}>View Original PDF</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 12,
    paddingHorizontal: 60,
  },
  stickyHeaderInner: {
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 8,
    zIndex: 20,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: theme.colors.glow,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.2)',
  },
  pdfBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.select({ ios: 40, android: 120, default: 40 }),
  },
  heroSection: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: theme.colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 24,
  },
  sectionCard: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  sectionNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionNumber: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
  sectionContent: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  fullPdfLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.glow,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.15)',
    marginTop: 8,
  },
  fullPdfText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
});
