import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, ExternalLink, GraduationCap } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { WILDFIRE_RESOURCES } from '@/constants/resources';
import { TUTORIALS } from '@/constants/tutorials';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResourcesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const appTour = TUTORIALS.find(t => t.id === 'app-walkthrough');
  const appTutorials = TUTORIALS.filter(
    t => t.category === 'tutorial' && t.id !== 'app-walkthrough'
  );
  const knowledgeBase = TUTORIALS.filter(t => t.category === 'knowledge');

  const renderIcon = (iconName: string, color: string, size = 18) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon size={size} color={color} strokeWidth={2} /> : <BookOpen size={size} color={color} strokeWidth={2} />;
  };

  const openTutorial = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/resources/${id}` as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topIconWrap}>
            <GraduationCap size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.topTitle}>Resources</Text>
            <Text style={styles.topSubtitle}>Tutorials, guides & references</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {appTour && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => openTutorial(appTour.id)}
            activeOpacity={0.85}
          >
            <View style={styles.featuredTop}>
              <View style={styles.featuredIconWrap}>
                {renderIcon(appTour.icon, colors.primary, 22)}
              </View>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>START HERE</Text>
              </View>
            </View>
            <Text style={styles.featuredTitle}>{appTour.title}</Text>
            <Text style={styles.featuredSubtitle}>{appTour.subtitle}</Text>
            <View style={styles.featuredFooter}>
              <Text style={styles.featuredMeta}>
                {appTour.sections.length} steps
                {appTour.readTime ? ` · ${appTour.readTime}` : ''}
              </Text>
              <View style={styles.featuredCta}>
                <Text style={styles.featuredCtaText}>Begin Tour</Text>
                <ChevronRight size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {appTutorials.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>App Tutorials</Text>
            {appTutorials.map(tutorial => (
              <TouchableOpacity
                key={tutorial.id}
                style={styles.rowCard}
                onPress={() => openTutorial(tutorial.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: tutorial.color + '18' }]}>
                  {renderIcon(tutorial.icon, tutorial.color, 18)}
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{tutorial.title}</Text>
                  <Text style={styles.rowSub}>
                    {tutorial.sections.length} steps
                    {tutorial.readTime ? ` · ${tutorial.readTime}` : ''}
                  </Text>
                </View>
                <ChevronRight size={15} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {knowledgeBase.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Knowledge Base</Text>
            {knowledgeBase.map(article => (
              <TouchableOpacity
                key={article.id}
                style={styles.rowCard}
                onPress={() => openTutorial(article.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: article.color + '18' }]}>
                  {renderIcon(article.icon, article.color, 18)}
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{article.title}</Text>
                  <Text style={styles.rowSub}>
                    {article.sections.length} sections
                  </Text>
                </View>
                <ChevronRight size={15} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {WILDFIRE_RESOURCES.map(category => (
          <View key={category.id}>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{category.title}</Text>
            {category.items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.rowCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(item.url).catch(() => {});
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: category.color + '14' }]}>
                  {renderIcon(category.icon, category.color, 16)}
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={[styles.rowFormat, { color: category.color }]}>
                    {item.format.toUpperCase()}
                  </Text>
                </View>
                <ExternalLink size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    topIconWrap: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.glow,
      justifyContent: 'center', alignItems: 'center',
    },
    topTitle: { fontSize: 17, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
    topSubtitle: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
    featuredCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: 'rgba(232, 65, 42, 0.2)',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 4,
    },
    featuredTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    featuredIconWrap: {
      width: 44, height: 44, borderRadius: 14,
      backgroundColor: colors.glow,
      justifyContent: 'center', alignItems: 'center',
    },
    featuredBadge: {
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: 7,
      backgroundColor: colors.primary,
    },
    featuredBadgeText: {
      fontSize: 10, fontWeight: '800' as const,
      color: '#fff', letterSpacing: 0.8,
    },
    featuredTitle: {
      fontSize: 20, fontWeight: '800' as const,
      color: colors.text, letterSpacing: -0.3, marginBottom: 6,
    },
    featuredSubtitle: {
      fontSize: 13, color: colors.textSecondary,
      lineHeight: 19, marginBottom: 18,
    },
    featuredFooter: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
    },
    featuredMeta: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' as const },
    featuredCta: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 999, backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
    },
    featuredCtaText: { fontSize: 13, fontWeight: '700' as const, color: '#fff' },
    sectionLabel: {
      fontSize: 11, fontWeight: '700' as const,
      color: colors.textTertiary, letterSpacing: 0.9,
      textTransform: 'uppercase' as const,
      marginBottom: 10, marginTop: 4,
    },
    rowCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 14, padding: 13,
      marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    rowIconWrap: {
      width: 38, height: 38, borderRadius: 11,
      justifyContent: 'center', alignItems: 'center',
    },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.text, marginBottom: 3 },
    rowSub: { fontSize: 12, color: colors.textTertiary },
    rowFormat: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },
  });
}
