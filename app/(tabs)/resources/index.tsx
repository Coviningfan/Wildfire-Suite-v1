import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import { FileQuestion } from 'lucide-react-native';
import { WILDFIRE_RESOURCES } from '@/constants/resources';
import { TUTORIALS } from '@/constants/tutorials';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export default function ResourcesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const hasTutorials = TUTORIALS.length > 0;
  const hasResources = WILDFIRE_RESOURCES.length > 0;

  const handleResourcePress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  const handleTutorialPress = (tutorialId: string) => {
    router.push(`/resources/tutorials/${tutorialId}`);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const renderIcon = (iconName: string, color: string, size: number = 24) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? (
      <IconComponent size={size} color={color} strokeWidth={2.5} />
    ) : null;
  };

  if (!hasTutorials && !hasResources) {
    return (
      <SafeAreaView style={dynamicStyles.emptyContainer} edges={['top']}>
        <View style={dynamicStyles.emptyContent}>
          <View style={dynamicStyles.emptyIconWrap}>
            <FileQuestion size={32} color={colors.textTertiary} />
          </View>
          <Text style={dynamicStyles.emptyTitle}>No Resources Available</Text>
          <Text style={dynamicStyles.emptySubtitle}>Tutorials and documentation will appear here when available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Resources & Tutorials</Text>
          <Text style={styles.headerSubtitle}>
            Technical documentation, standards, and learning materials
          </Text>
        </LinearGradient>

        <View style={[styles.categoryContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.categoryHeader}>
            {renderIcon('GraduationCap', colors.accent, 28)}
            <Text style={[styles.categoryTitle, { color: colors.text }]}>Interactive Tutorials</Text>
          </View>
          <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
            Deep-dive educational content on UV lighting, fluorescence, and
            effects technology
          </Text>

          <View style={styles.tutorialsGrid}>
            {TUTORIALS.map((tutorial) => (
              <TouchableOpacity
                key={tutorial.id}
                style={styles.tutorialCard}
                onPress={() => handleTutorialPress(tutorial.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[tutorial.color, `${tutorial.color}DD`]}
                  style={styles.tutorialGradient}
                >
                  <View style={styles.tutorialIconContainer}>
                    {renderIcon(tutorial.icon, '#fff', 28)}
                  </View>
                  <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                  <Text style={styles.tutorialSubtitle}>
                    {tutorial.subtitle}
                  </Text>
                  <View style={styles.tutorialFooter}>
                    <Text style={styles.tutorialSections}>
                      {tutorial.sections.length} sections
                    </Text>
                    {renderIcon('ChevronRight', 'rgba(255,255,255,0.7)', 20)}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {WILDFIRE_RESOURCES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          return (
            <View key={category.id} style={[styles.categoryContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                {renderIcon(category.icon, category.color, 28)}
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.title}</Text>
                <View style={{ flex: 1 }} />
                {renderIcon(
                  isExpanded ? 'ChevronUp' : 'ChevronDown',
                  '#64748b',
                  24
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.itemsContainer}>
                  {category.items.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.resourceItem,
                        { borderLeftColor: category.color, backgroundColor: colors.surfaceSecondary },
                      ]}
                      onPress={() => handleResourcePress(item.url)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resourceContent}>
                        <Text style={[styles.resourceTitle, { color: colors.text }]}>{item.title}</Text>
                        <View style={styles.resourceMeta}>
                          <View
                            style={[
                              styles.formatBadge,
                              {
                                backgroundColor: `${category.color}22`,
                                borderColor: `${category.color}66`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.formatText,
                                { color: category.color },
                              ]}
                            >
                              {item.format.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {renderIcon('ExternalLink', '#64748b', 20)}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

function createDynamicStyles(colors: ThemeColors) {
  return StyleSheet.create({
    emptyContainer: { flex: 1, backgroundColor: colors.background },
    emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyIconWrap: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
    emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: colors.text, textAlign: 'center' as const },
    emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' as const, marginTop: 8, lineHeight: 20 },
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  categoryContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginLeft: 12,
    flex: 1,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 16,
  },
  tutorialsGrid: {
    gap: 12,
  },
  tutorialCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tutorialGradient: {
    padding: 20,
  },
  tutorialIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  tutorialSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 12,
  },
  tutorialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorialSections: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  itemsContainer: {
    marginTop: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  resourceContent: {
    flex: 1,
    marginRight: 12,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    height: 40,
  },
});
