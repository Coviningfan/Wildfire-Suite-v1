import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Lightbulb, Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { useLightingStore } from '@/stores/lighting-store';
import { Input } from '@/components/ui/Input';
import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { FixtureDetailModal } from '@/components/fixtures/FixtureDetailModal';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFixtureCategory, FIXTURE_SERIES_LABELS, getFixtureControlType } from '@/utils/fixture-helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallPhone = SCREEN_WIDTH < 380;

const SERIES_COLORS: Record<string, string> = {
  VSP: '#E8412A',
  EM: '#F5A623',
  UB: '#3B9FE8',
  UR: '#22C55E',
  L: '#7C6BF0',
};

function getSeriesColor(key: string) {
  return SERIES_COLORS[key] ?? '#8E8E93';
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
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { selectedFixture, setSelectedFixture } = useLightingStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [detailFixture, setDetailFixture] = useState<string | null>(null);

  const fixtureModels = LightingCalculator.getFixtureModels();

  const categories = useMemo(() => {
    const cats = Array.from(new Set(fixtureModels.map(getFixtureCategory)));
    return cats;
  }, [fixtureModels]);

  const filteredFixtures = useMemo(() =>
    fixtureModels.filter(model => {
      const matchesSearch = searchQuery === '' ||
        model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getFixtureCategory(model).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeries = selectedSeries === '' ||
        getSeriesKey(getFixtureCategory(model)) === selectedSeries;
      return matchesSearch && matchesSeries;
    }), [fixtureModels, searchQuery, selectedSeries]);

  const groupedFixtures = useMemo(() =>
    filteredFixtures.reduce<Record<string, string[]>>((acc, model) => {
      const cat = getFixtureCategory(model);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(model);
      return acc;
    }, {}), [filteredFixtures]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedSeries('');
  }, []);

  const hasFilters = searchQuery !== '' || selectedSeries !== '';

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
            <Lightbulb size={16} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.screenTitle}>Fixtures</Text>
            <Text style={styles.screenSub}>{filteredFixtures.length} of {fixtureModels.length} models</Text>
          </View>
        </View>
        {hasFilters && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters} activeOpacity={0.7}>
            <X size={14} color={colors.error} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchSection}>
        <Input label="" value={searchQuery} onChangeText={setSearchQuery} placeholder="Search fixtures..." />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.seriesScroll}
        contentContainerStyle={styles.seriesScrollContent}
      >
        {Object.entries(FIXTURE_SERIES_LABELS).map(([key, label]) => {
          const isActive = selectedSeries === key;
          const color = getSeriesColor(key);
          const count = fixtureModels.filter(m => getSeriesKey(getFixtureCategory(m)) === key).length;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.seriesChip,
                {
                  borderColor: isActive ? color + '60' : colors.border,
                  backgroundColor: isActive ? color + '14' : colors.surface,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedSeries(selectedSeries === key ? '' : key);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.seriesChipDot, { backgroundColor: color }]} />
              <Text style={[styles.seriesChipText, { color: isActive ? color : colors.textSecondary }]}>{key}</Text>
              <Text style={[styles.seriesChipCount, { color: isActive ? color : colors.textTertiary }]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {Object.keys(groupedFixtures).length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Search size={28} color={colors.textTertiary} />
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
                    <Text style={styles.categoryTitle} numberOfLines={1}>{category}</Text>
                    <View style={styles.categoryMeta}>
                      <View style={[styles.controlBadge, { backgroundColor: color + '14' }]}>
                        <Text style={[styles.controlText, { color }]}>{getFixtureControlType(fixtures[0])}</Text>
                      </View>
                      <Text style={styles.categoryCount}>{fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''}</Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContainer: { flex: 1 },
    scrollContent: { paddingBottom: Platform.select({ ios: 40, android: 120, default: 40 }) },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    titleIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(124, 107, 240, 0.12)', justifyContent: 'center', alignItems: 'center' },
    screenTitle: { fontSize: 18, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
    screenSub: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' as const, marginTop: 1 },
    clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
    clearBtnText: { fontSize: 12, color: colors.error, fontWeight: '600' as const },
    searchSection: { paddingHorizontal: 16, marginBottom: 4 },
    seriesScroll: { maxHeight: 44 },
    seriesScrollContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingBottom: 10 },
    seriesChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: isSmallPhone ? 10 : 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
    seriesChipDot: { width: 6, height: 6, borderRadius: 3 },
    seriesChipText: { fontSize: 12, fontWeight: '700' as const },
    seriesChipCount: { fontSize: 10, fontWeight: '600' as const },
    categorySection: { marginBottom: 16, paddingHorizontal: 16 },
    categoryHeader: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 10 },
    categoryLine: { width: 3, borderRadius: 2 },
    categoryTitleWrap: { flex: 1 },
    categoryTitle: { fontSize: isSmallPhone ? 13 : 14, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.1 },
    categoryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    controlBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    controlText: { fontSize: 10, fontWeight: '700' as const },
    categoryCount: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' as const },
    fixturesGrid: { gap: 8 },
    emptyContainer: { alignItems: 'center', padding: 40, marginTop: 20 },
    emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
    emptySubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' as const, marginTop: 6 },
    emptyAction: { marginTop: 16, paddingVertical: 9, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.glow },
    emptyActionText: { fontSize: 13, fontWeight: '700' as const, color: colors.primary },
    footer: { alignItems: 'center', paddingVertical: 28 },
    footerDivider: { width: 32, height: 2, borderRadius: 1, backgroundColor: colors.border, marginBottom: 14 },
    footerText: { fontSize: 11, color: colors.textTertiary },
    footerBrand: { color: colors.primary, fontWeight: '700' as const },
  });
}
