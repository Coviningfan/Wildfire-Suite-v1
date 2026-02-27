import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Linking, Alert, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BookOpen, GraduationCap, ShieldAlert, FileBarChart,
  Settings2, Ruler, Award, ExternalLink, FileText,
  Archive, ChevronRight, Search, X, Clock,
  Atom, Zap, Lightbulb, Flame, Cpu, Camera, Paintbrush,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { WILDFIRE_RESOURCES, ResourceCategory, ResourceItem } from '@/constants/resources';
import { TUTORIALS, Tutorial } from '@/constants/tutorials';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Award, GraduationCap, ShieldAlert, FileBarChart, BookOpen, Settings2, Ruler, Paintbrush,
};

const TUTORIAL_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Atom, Zap, Lightbulb, Flame, Cpu, Camera, BookOpen,
};

const FORMAT_META: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  pdf: { label: 'PDF', icon: FileText, color: '#E8412A' },
  zip: { label: 'ZIP', icon: Archive, color: '#3B82F6' },
  web: { label: 'WEB', icon: ExternalLink, color: '#22C55E' },
};

async function openUrl(url: string) {
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
}

type TabKey = 'tutorials' | 'documents';

export default function ResourcesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('tutorials');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const docCategories = useMemo(() =>
    WILDFIRE_RESOURCES.filter(c => c.id !== 'tutorials'),
    []
  );

  const totalDocs = useMemo(() =>
    docCategories.reduce((sum, cat) => sum + cat.items.length, 0),
    [docCategories]
  );

  const filteredTutorials = useMemo(() => {
    if (!searchQuery.trim()) return TUTORIALS;
    const q = searchQuery.toLowerCase();
    return TUTORIALS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return docCategories;
    const q = searchQuery.toLowerCase();
    return docCategories.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        cat.title.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery, docCategories]);

  const handleToggleCategory = useCallback((id: string) => {
    Haptics.selectionAsync();
    setExpandedCategory(prev => prev === id ? null : id);
  }, []);

  const handleOpenResource = useCallback(async (item: ResourceItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openUrl(item.url);
  }, []);

  const handleOpenTutorial = useCallback((tutorial: Tutorial) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/resources/${tutorial.id}` as any);
  }, [router]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.titleIcon}>
            <BookOpen size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.screenTitle}>Resources</Text>
            <Text style={styles.screenSub}>
              {TUTORIALS.length} tutorials · {totalDocs} documents
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tutorials' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('tutorials'); }}
          activeOpacity={0.7}
        >
          <GraduationCap size={15} color={activeTab === 'tutorials' ? theme.colors.primary : theme.colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'tutorials' && styles.tabTextActive]}>Tutorials</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('documents'); }}
          activeOpacity={0.7}
        >
          <FileText size={15} color={activeTab === 'documents' ? theme.colors.primary : theme.colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>Documents</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={16} color={theme.colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={activeTab === 'tutorials' ? 'Search tutorials...' : 'Search documents...'}
            placeholderTextColor={theme.colors.placeholder}
          />
          {hasSearch && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'tutorials' && (
          <>
            {filteredTutorials.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Search size={28} color={theme.colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Results</Text>
                <Text style={styles.emptySub}>Try a different search term.</Text>
              </View>
            ) : (
              filteredTutorials.map((tutorial) => {
                const TutIcon = TUTORIAL_ICON_MAP[tutorial.icon] ?? BookOpen;
                return (
                  <TouchableOpacity
                    key={tutorial.id}
                    style={styles.tutorialCard}
                    onPress={() => handleOpenTutorial(tutorial)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.tutorialIconWrap, { backgroundColor: tutorial.color + '18' }]}>
                      <TutIcon size={20} color={tutorial.color} />
                    </View>
                    <View style={styles.tutorialInfo}>
                      <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                      <Text style={styles.tutorialSubtitle} numberOfLines={1}>{tutorial.subtitle}</Text>
                      <View style={styles.tutorialMeta}>
                        <Clock size={11} color={theme.colors.textTertiary} />
                        <Text style={styles.tutorialMetaText}>{tutorial.readTime}</Text>
                        <View style={styles.tutorialDot} />
                        <Text style={styles.tutorialMetaText}>{tutorial.sections.length} sections</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {activeTab === 'documents' && (
          <>
            {filteredResources.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Search size={28} color={theme.colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Results</Text>
                <Text style={styles.emptySub}>Try a different search term.</Text>
              </View>
            ) : (
              filteredResources.map((category) => {
                const isExpanded = expandedCategory === category.id || hasSearch;
                const IconComponent = ICON_MAP[category.icon] ?? BookOpen;
                return (
                  <View key={category.id} style={styles.categoryCard}>
                    <TouchableOpacity
                      style={styles.categoryHeader}
                      onPress={() => handleToggleCategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryIconWrap, { backgroundColor: category.color + '18' }]}>
                        <IconComponent size={18} color={category.color} />
                      </View>
                      <View style={styles.categoryTextWrap}>
                        <Text style={styles.categoryTitle}>{category.title}</Text>
                        <Text style={styles.categoryCount}>
                          {category.items.length} document{category.items.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={[styles.chevronWrap, isExpanded && styles.chevronExpanded]}>
                        <ChevronRight size={16} color={theme.colors.textTertiary} />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.itemsList}>
                        {category.items.map((item, idx) => {
                          const fmt = FORMAT_META[item.format];
                          const FormatIcon = fmt.icon;
                          const isLast = idx === category.items.length - 1;
                          return (
                            <TouchableOpacity
                              key={item.title + idx}
                              style={[styles.itemRow, isLast && styles.itemRowLast]}
                              onPress={() => handleOpenResource(item)}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.formatBadge, { backgroundColor: fmt.color + '14' }]}>
                                <FormatIcon size={13} color={fmt.color} />
                              </View>
                              <View style={styles.itemTextWrap}>
                                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                                <Text style={[styles.itemFormat, { color: fmt.color }]}>{fmt.label}</Text>
                              </View>
                              <ExternalLink size={14} color={theme.colors.textTertiary} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}

            <TouchableOpacity
              style={styles.supportLink}
              onPress={() => openUrl('https://wildfirelighting.com/support/')}
              activeOpacity={0.7}
            >
              <ExternalLink size={14} color={theme.colors.primary} />
              <Text style={styles.supportLinkText}>View all on wildfirelighting.com</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Powered by <Text style={styles.footerBrand}>JABVLabs</Text></Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: theme.colors.glow,
    borderColor: 'rgba(232, 65, 42, 0.25)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.colors.textTertiary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  scrollContainer: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ ios: 40, android: 120, default: 40 }),
  },
  tutorialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tutorialIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  tutorialSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 6,
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tutorialMetaText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
  },
  tutorialDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textTertiary,
    marginHorizontal: 3,
  },
  categoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTextWrap: { flex: 1 },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.1,
  },
  categoryCount: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  itemsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  formatBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextWrap: { flex: 1 },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.colors.text,
    lineHeight: 18,
  },
  itemFormat: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  supportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.glow,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.15)',
  },
  supportLinkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  footerDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 14,
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  footerBrand: {
    color: theme.colors.primary,
    fontWeight: '700' as const,
  },
});
