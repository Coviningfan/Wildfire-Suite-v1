import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Lightbulb, Search, Filter, X, Sparkles, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { useLightingStore } from '@/stores/lighting-store';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { FixtureDetailModal } from '@/components/fixtures/FixtureDetailModal';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFixtureCategory, FIXTURE_SERIES_LABELS, getFixtureControlType, getFixturePowerWatts } from '@/utils/fixture-helpers';

const SERIES_COLORS: Record<string, string> = {
  VSP: '#E8412A',
  EM: '#F5A623',
  UB: '#3B9FE8',
  UR: '#22C55E',
  L: '#7C6BF0',
};

function getSeriesColor(key: string) {
  return SERIES_COLORS[key] ?? theme.colors.textSecondary;
}

function getSeriesKey(category: string) {
  if (category.startsWith('VSP')) return 'VSP';
  if (category.startsWith('EM')) return 'EM';
  if (category.startsWith('UB')) return 'UB';
  if (category.startsWith('UR')) return 'UR';
  if (category.startsWith('L')) return 'L';
  return '';
}

export default function FixtureLibraryScreen() {
  const { selectedFixture, setSelectedFixture } = useLightingStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [detailFixture, setDetailFixture] = useState<string | null>(null);

  const fixtureModels = LightingCalculator.getFixtureModels();

  const categories = useMemo(() => {
    const cats = Array.from(new Set(fixtureModels.map(getFixtureCategory)));
    return ['', ...cats];
  }, [fixtureModels]);

  const categoryOptions = useMemo(() =>
    categories.map(c => (c === '' ? 'All Series' : c)), [categories]);

  const filteredFixtures = useMemo(() =>
    fixtureModels.filter(model => {
      const matchesSearch = searchQuery === '' ||
        model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getFixtureCategory(model).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '' || selectedCategory === 'All Series' ||
        getFixtureCategory(model) === selectedCategory;
      return matchesSearch && matchesCategory;
    }), [fixtureModels, searchQuery, selectedCategory]);

  const groupedFixtures = useMemo(() =>
    filteredFixtures.reduce<Record<string, string[]>>((acc, model) => {
      const cat = getFixtureCategory(model);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(model);
      return acc;
    }, {}), [filteredFixtures]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {detailFixture != null && (
        <FixtureDetailModal
          model={detailFixture}
          isSelected={selectedFixture === detailFixture}
          onSelect={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedFixture(detailFixture);
            setDetailFixture(null);
          }}
          onClose={() => setDetailFixture(null)}
        />
      )}

      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.titleIcon}>
            <Lightbulb size={16} color={theme.colors.accent} />
          </View>
          <View>
            <Text style={styles.screenTitle}>Fixtures</Text>
            <Text style={styles.screenSub}>{fixtureModels.length} models</Text>
          </View>
        </View>
      </View>

      <View style={styles.seriesRow}>
        {Object.entries(FIXTURE_SERIES_LABELS).map(([key, label]) => {
          const shortLabel = key;
          const isActive = selectedCategory === '' || getSeriesKey(selectedCategory) === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.seriesChip, { borderColor: isActive ? getSeriesColor(key) + '40' : theme.colors.border, backgroundColor: isActive ? getSeriesColor(key) + '10' : 'transparent' }]}
              onPress={() => {
                Haptics.selectionAsync();
                if (getSeriesKey(selectedCategory) === key) {
                  setSelectedCategory('');
                } else {
                  const cat = categories.find(c => c.startsWith(key));
                  setSelectedCategory(cat ?? '');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.seriesChipDot, { backgroundColor: getSeriesColor(key) }]} />
              <Text style={[styles.seriesChipText, { color: isActive ? getSeriesColor(key) : theme.colors.textTertiary }]}>{shortLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchSection}>
        <Input label="" value={searchQuery} onChangeText={setSearchQuery} placeholder="Search fixtures..." />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {Object.keys(groupedFixtures).length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Search size={32} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Fixtures Found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or clear filters.</Text>
            <TouchableOpacity style={styles.emptyAction} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.emptyActionText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(groupedFixtures).map(([category, fixtures]) => {
            const seriesKey = getSeriesKey(category);
            const color = getSeriesColor(seriesKey);
            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryLine, { backgroundColor: color }]} />
                  <View style={styles.categoryTitleWrap}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <View style={styles.categoryMeta}>
                      <View style={[styles.controlBadge, { backgroundColor: color + '14' }]}>
                        <Text style={[styles.controlText, { color }]}>{getFixtureControlType(fixtures[0])}</Text>
                      </View>
                      <Text style={styles.categoryCount}>{fixtures.length} fixtures</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.fixturesGrid}>
                  {fixtures.map(model => (
                    <FixtureCard
                      key={model}
                      model={model}
                      isSelected={selectedFixture === model}
                      onSelect={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedFixture(model);
                      }}
                      onDetail={() => setDetailFixture(model)}
                    />
                  ))}
                </View>
              </View>
            );
          })
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
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: Platform.select({ ios: 20, android: 100, default: 20 }) },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(124, 107, 240, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
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
  seriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  seriesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  seriesChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  seriesChipText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  searchSection: { paddingHorizontal: 16, marginBottom: 4 },
  categorySection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 12,
  },
  categoryLine: {
    width: 3,
    borderRadius: 2,
  },
  categoryTitleWrap: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.1,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  controlBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  controlText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  categoryCount: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
  },
  fixturesGrid: { gap: 8 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: theme.colors.text },
  emptySubtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 6 },
  emptyAction: {
    marginTop: 16, paddingVertical: 9, paddingHorizontal: 20,
    borderRadius: 10, borderWidth: 1, borderColor: theme.colors.primary,
    backgroundColor: theme.colors.glow,
  },
  emptyActionText: { fontSize: 13, fontWeight: '700' as const, color: theme.colors.primary },
  footer: { alignItems: 'center', paddingVertical: 28 },
  footerDivider: { width: 32, height: 2, borderRadius: 1, backgroundColor: theme.colors.border, marginBottom: 14 },
  footerText: { fontSize: 11, color: theme.colors.textTertiary },
  footerBrand: { color: theme.colors.primary, fontWeight: '700' as const },
});
