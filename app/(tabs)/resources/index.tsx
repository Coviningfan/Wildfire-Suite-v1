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
  Globe, Download, Layers, Pen, Heart, ShoppingCart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { WILDFIRE_RESOURCES, ResourceCategory, ResourceItem } from '@/constants/resources';
import { TUTORIALS, Tutorial } from '@/constants/tutorials';
import { useFavoritesStore } from '@/stores/favorites-store';

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

const SUPPORT_RESOURCES = [
  { icon: Pen, label: 'CAD Drawings' },
  { icon: Settings2, label: 'DMX Charts' },
  { icon: Download, label: 'Firmware' },
  { icon: Layers, label: 'Vectorworks Symbols' },
];

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

type TabKey = 'tutorials' | 'documents' | 'favorites';

export default function ResourcesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('tutorials');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    favoriteResources, favoriteTutorials,
    toggleResourceFavorite, toggleTutorialFavorite,
    isResourceFavorite, isTutorialFavorite,
  } = useFavoritesStore();

  const docCategories = useMemo(() =>
    WILDFIRE_RESOURCES.filter(c => c.id !== 'tutorials'),
    []
  );

  const totalDocs = useMemo(() =>
    docCategories.reduce((sum, cat) => sum + cat.items.length, 0),
    [docCategories]
  );

  const favCount = favoriteResources.length + favoriteTutorials.length;

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

  const favoriteTutorialsList = useMemo(() =>
    TUTORIALS.filter(t => favoriteTutorials.includes(t.id)),
    [favoriteTutorials]
  );

  const favoriteResourcesList = useMemo(() => {
    const items: Array<ResourceItem & { categoryTitle: string }> = [];
    docCategories.forEach(cat => {
      cat.items.forEach(item => {
        if (favoriteResources.includes(item.title)) {
          items.push({ ...item, categoryTitle: cat.title });
        }
      });
    });
    return items;
  }, [favoriteResources, docCategories]);

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

  const handleOpenSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openUrl('https://wildfirelighting.com/support/');
  }, []);

  const handleOpenShop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openUrl('https://store.wildfirelighting.com/');
  }, []);

  const handleToggleResourceFav = useCallback((title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleResourceFavorite(title);
  }, [toggleResourceFavorite]);

  const handleToggleTutorialFav = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTutorialFavorite(id);
  }, [toggleTutorialFavorite]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.titleIcon}>
            <BookOpen size={16} color={colors.primary} />
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
          <GraduationCap size={14} color={activeTab === 'tutorials' ? colors.primary : colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'tutorials' && styles.tabTextActive]}>Tutorials</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('documents'); }}
          activeOpacity={0.7}
        >
          <FileText size={14} color={activeTab === 'documents' ? colors.primary : colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>Docs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('favorites'); }}
          activeOpacity={0.7}
        >
          <Heart size={14} color={activeTab === 'favorites' ? colors.primary : colors.textTertiary} fill={activeTab === 'favorites' ? colors.primary : 'none'} />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>Saved</Text>
          {favCount > 0 && (
            <View style={styles.favBadge}>
              <Text style={styles.favBadgeText}>{favCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab !== 'favorites' && (
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={activeTab === 'tutorials' ? 'Search tutorials...' : 'Search documents...'}
              placeholderTextColor={colors.placeholder}
            />
            {hasSearch && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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
                  <Search size={28} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Results</Text>
                <Text style={styles.emptySub}>Try a different search term.</Text>
              </View>
            ) : (
              filteredTutorials.map((tutorial) => {
                const TutIcon = TUTORIAL_ICON_MAP[tutorial.icon] ?? BookOpen;
                const isFav = isTutorialFavorite(tutorial.id);
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
                        <Clock size={11} color={colors.textTertiary} />
                        <Text style={styles.tutorialMetaText}>{tutorial.readTime}</Text>
                        <View style={styles.tutorialDot} />
                        <Text style={styles.tutorialMetaText}>{tutorial.sections.length} sections</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); handleToggleTutorialFav(tutorial.id); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.favBtn}
                    >
                      <Heart size={16} color={isFav ? '#EF4444' : colors.textTertiary} fill={isFav ? '#EF4444' : 'none'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {activeTab === 'documents' && (
          <>
            {filteredResources.length === 0 && !hasSearch ? null : filteredResources.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Search size={28} color={colors.textTertiary} />
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
                        <ChevronRight size={16} color={colors.textTertiary} />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.itemsList}>
                        {category.items.map((item, idx) => {
                          const fmt = FORMAT_META[item.format];
                          const FormatIcon = fmt.icon;
                          const isLast = idx === category.items.length - 1;
                          const isFav = isResourceFavorite(item.title);
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
                              <TouchableOpacity
                                onPress={(e) => { e.stopPropagation(); handleToggleResourceFav(item.title); }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.itemFavBtn}
                              >
                                <Heart size={13} color={isFav ? '#EF4444' : colors.textTertiary} fill={isFav ? '#EF4444' : 'none'} />
                              </TouchableOpacity>
                              <ExternalLink size={14} color={colors.textTertiary} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {!hasSearch && (
              <>
                <TouchableOpacity
                  style={styles.shopCard}
                  onPress={handleOpenShop}
                  activeOpacity={0.7}
                >
                  <View style={styles.shopIconWrap}>
                    <ShoppingCart size={18} color="#fff" />
                  </View>
                  <View style={styles.shopTextWrap}>
                    <Text style={styles.shopTitle}>Shop Wildfire Products</Text>
                    <Text style={styles.shopDesc}>Browse fixtures, paints, and accessories</Text>
                  </View>
                  <ExternalLink size={16} color={colors.secondary} />
                </TouchableOpacity>

                <View style={styles.supportCard}>
                  <View style={styles.supportCardHeader}>
                    <View style={styles.supportGlobeWrap}>
                      <Globe size={18} color="#fff" />
                    </View>
                    <View style={styles.supportCardHeaderText}>
                      <Text style={styles.supportCardTitle}>More on wildfirelighting.com</Text>
                      <Text style={styles.supportCardDesc}>
                        These resources are available on our support page:
                      </Text>
                    </View>
                  </View>

                  <View style={styles.supportItemsGrid}>
                    {SUPPORT_RESOURCES.map((item, idx) => {
                      const ItemIcon = item.icon;
                      return (
                        <View key={idx} style={styles.supportItem}>
                          <ItemIcon size={14} color={colors.textSecondary} />
                          <Text style={styles.supportItemText}>{item.label}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.supportBtn}
                    onPress={handleOpenSupport}
                    activeOpacity={0.7}
                  >
                    <ExternalLink size={15} color="#fff" />
                    <Text style={styles.supportBtnText}>Visit Support Page</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {favCount === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Heart size={28} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
                <Text style={styles.emptySub}>Tap the heart icon on any tutorial or document to save it here.</Text>
              </View>
            ) : (
              <>
                {favoriteTutorialsList.length > 0 && (
                  <View style={styles.favSection}>
                    <Text style={styles.favSectionLabel}>TUTORIALS</Text>
                    {favoriteTutorialsList.map((tutorial) => {
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
                          </View>
                          <TouchableOpacity
                            onPress={() => handleToggleTutorialFav(tutorial.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.favBtn}
                          >
                            <Heart size={16} color="#EF4444" fill="#EF4444" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {favoriteResourcesList.length > 0 && (
                  <View style={styles.favSection}>
                    <Text style={styles.favSectionLabel}>DOCUMENTS</Text>
                    {favoriteResourcesList.map((item, idx) => {
                      const fmt = FORMAT_META[item.format];
                      const FormatIcon = fmt.icon;
                      return (
                        <TouchableOpacity
                          key={item.title + idx}
                          style={styles.favResourceCard}
                          onPress={() => handleOpenResource(item)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.formatBadge, { backgroundColor: fmt.color + '14' }]}>
                            <FormatIcon size={13} color={fmt.color} />
                          </View>
                          <View style={styles.itemTextWrap}>
                            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.favResourceCat}>{item.categoryTitle}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleToggleResourceFav(item.title)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.itemFavBtn}
                          >
                            <Heart size={13} color="#EF4444" fill="#EF4444" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    titleIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.glow, justifyContent: 'center', alignItems: 'center' },
    screenTitle: { fontSize: 18, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
    screenSub: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' as const, marginTop: 1 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tabActive: { backgroundColor: colors.glow, borderColor: 'rgba(232, 65, 42, 0.25)' },
    tabText: { fontSize: 12, fontWeight: '600' as const, color: colors.textTertiary },
    tabTextActive: { color: colors.primary },
    favBadge: { backgroundColor: colors.primary, borderRadius: 8, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, marginLeft: -1 },
    favBadgeText: { fontSize: 10, fontWeight: '700' as const, color: '#fff' },
    searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
    searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0, margin: 0 },
    scrollContainer: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: Platform.select({ ios: 40, android: 120, default: 40 }) },
    tutorialCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    tutorialIconWrap: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    tutorialInfo: { flex: 1 },
    tutorialTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.1, marginBottom: 2 },
    tutorialSubtitle: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' as const, marginBottom: 6 },
    tutorialMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tutorialMetaText: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' as const },
    tutorialDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary, marginHorizontal: 3 },
    favBtn: { padding: 4 },
    categoryCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: 'hidden' },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    categoryIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    categoryTextWrap: { flex: 1 },
    categoryTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.1 },
    categoryCount: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' as const, marginTop: 2 },
    chevronWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
    chevronExpanded: { transform: [{ rotate: '90deg' }] },
    itemsList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 16 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    itemRowLast: { borderBottomWidth: 0 },
    formatBadge: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    itemTextWrap: { flex: 1 },
    itemTitle: { fontSize: 13, fontWeight: '600' as const, color: colors.text, lineHeight: 18 },
    itemFormat: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5, marginTop: 2 },
    itemFavBtn: { padding: 4 },
    shopCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginTop: 6, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.25)' },
    shopIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },
    shopTextWrap: { flex: 1 },
    shopTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.1, marginBottom: 2 },
    shopDesc: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' as const },
    supportCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 8 },
    supportCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    supportGlobeWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    supportCardHeaderText: { flex: 1 },
    supportCardTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.1, marginBottom: 3 },
    supportCardDesc: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' as const, lineHeight: 17 },
    supportItemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    supportItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    supportItemText: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary },
    supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.primary },
    supportBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#fff' },
    favSection: { marginBottom: 16 },
    favSectionLabel: { fontSize: 11, fontWeight: '700' as const, color: colors.textTertiary, letterSpacing: 1, marginBottom: 10, paddingLeft: 2 },
    favResourceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    favResourceCat: { fontSize: 10, color: colors.textTertiary, fontWeight: '500' as const, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
    emptySub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' as const, paddingHorizontal: 24 },
    footer: { alignItems: 'center', paddingVertical: 28 },
    footerDivider: { width: 32, height: 2, borderRadius: 1, backgroundColor: colors.border, marginBottom: 14 },
    footerText: { fontSize: 11, color: colors.textTertiary },
    footerBrand: { color: colors.primary, fontWeight: '700' as const },
  });
}
