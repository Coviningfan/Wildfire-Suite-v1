import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Database, Search, Filter, X } from 'lucide-react-native';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { useLightingStore } from '@/stores/lighting-store';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Logo } from '@/components/ui/Logo';
import { PoweredBy } from '@/components/ui/PoweredBy';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { FixtureDetailModal } from '@/components/fixtures/FixtureDetailModal';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFixtureCategory, FIXTURE_SERIES_LABELS, getFixtureControlType } from '@/utils/fixture-helpers';

const SERIES_COLORS: Record<string, string> = {
  VSP: '#9B6DFF',
  EM: '#F5A623',
  UB: '#3B9FE8',
  UR: '#22C55E',
  L: '#E8412A',
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
          onSelect={() => { setSelectedFixture(detailFixture); setDetailFixture(null); }}
          onClose={() => setDetailFixture(null)}
        />
      )}

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Logo size="medium" />
          <View style={styles.titleRow}>
            <View style={styles.titleIconWrap}>
              <Database size={18} color={theme.colors.accent} />
            </View>
            <Text style={styles.title}>UV Fixture Library</Text>
            <InfoTooltip
              title="Fixture Library"
              body={`Browse all ${fixtureModels.length} Wildfire UV fixtures. Tap a card for full specs. Tap "Select Fixture" to use it in the Calculator.`}
            />
          </View>
          <Text style={styles.subtitle}>{fixtureModels.length} fixtures — tap for full specs</Text>
        </View>

        <View style={styles.legendRow}>
          {Object.entries(FIXTURE_SERIES_LABELS).map(([key, label]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getSeriesColor(key) }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.searchSection}>
          <Input label="" value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by model or series..." />
          <View style={styles.filterRow}>
            <TouchableOpacity style={[styles.filterToggle, showFilters && styles.filterToggleActive]} onPress={() => setShowFilters(!showFilters)} activeOpacity={0.7}>
              <Filter size={14} color={showFilters ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>{showFilters ? 'Hide' : 'Filter'}</Text>
            </TouchableOpacity>
            {(searchQuery || (selectedCategory && selectedCategory !== 'All Series')) ? (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.7}>
                <X size={13} color={theme.colors.error} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {showFilters && (
            <Card style={styles.filtersCard}>
              <Picker
                label="Filter by Series"
                value={selectedCategory === '' ? 'All Series' : selectedCategory}
                options={categoryOptions}
                onValueChange={(val) => setSelectedCategory(val === 'All Series' ? '' : val)}
              />
            </Card>
          )}
          <Text style={styles.resultsCount}>Showing {filteredFixtures.length} of {fixtureModels.length}</Text>
        </View>

        {Object.keys(groupedFixtures).length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Search size={36} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Fixtures Found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or clear filters.</Text>
            <TouchableOpacity style={styles.emptyAction} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.emptyActionText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(groupedFixtures).map(([category, fixtures]) => (
            <Card key={category}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: getSeriesColor(getSeriesKey(category)) }]} />
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.categoryCountWrap}>
                  <Text style={styles.categoryCount}>{fixtures.length}</Text>
                </View>
              </View>
              <View style={styles.controlBadgeRow}>
                <View style={[styles.controlBadge, {
                  backgroundColor: getFixtureControlType(fixtures[0]).includes('DMX') ? 'rgba(155, 109, 255, 0.12)' : 'rgba(34, 197, 94, 0.12)'
                }]}>
                  <Text style={[styles.controlBadgeText, {
                    color: getFixtureControlType(fixtures[0]).includes('DMX') ? '#9B6DFF' : '#22C55E'
                  }]}>{getFixtureControlType(fixtures[0])}</Text>
                </View>
              </View>
              <View style={styles.fixturesGrid}>
                {fixtures.map(model => (
                  <FixtureCard
                    key={model}
                    model={model}
                    isSelected={selectedFixture === model}
                    onSelect={() => setSelectedFixture(model)}
                    onDetail={() => setDetailFixture(model)}
                  />
                ))}
              </View>
            </Card>
          ))
        )}
        <PoweredBy />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: Platform.select({ ios: 20, android: 100, default: 20 }) },
  header: { alignItems: 'center', padding: 20, paddingTop: 14, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  titleIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(124, 107, 240, 0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '800' as const, color: theme.colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 6 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '500' as const },
  searchSection: { paddingHorizontal: 16, marginBottom: 8 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8 },
  filterToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  filterToggleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.glow,
  },
  filterToggleText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' as const },
  filterToggleTextActive: { color: theme.colors.primary },
  clearButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14 },
  clearButtonText: { fontSize: 13, color: theme.colors.error, fontWeight: '600' as const },
  filtersCard: { marginBottom: 8, marginHorizontal: 0 },
  resultsCount: { fontSize: 12, color: theme.colors.textTertiary, fontWeight: '500' as const },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryTitle: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text, flex: 1, letterSpacing: -0.1 },
  categoryCountWrap: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  categoryCount: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' as const },
  controlBadgeRow: { flexDirection: 'row', marginBottom: 12 },
  controlBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  controlBadgeText: { fontSize: 11, fontWeight: '700' as const },
  fixturesGrid: { gap: 10 },
  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: theme.colors.text, textAlign: 'center' as const, letterSpacing: -0.2 },
  emptySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 8 },
  emptyAction: {
    marginTop: 16, paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 12, borderWidth: 1, borderColor: theme.colors.primary,
    backgroundColor: theme.colors.glow,
  },
  emptyActionText: { fontSize: 14, fontWeight: '700' as const, color: theme.colors.primary },
});
