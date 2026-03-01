import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Modal, Pressable } from 'react-native';
import { Lightbulb, Search, X, GitCompareArrows, Check } from 'lucide-react-native';
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
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareFixtures, setCompareFixtures] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

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

  const toggleCompareFixture = useCallback((model: string) => {
    setCompareFixtures(prev => {
      if (prev.includes(model)) return prev.filter(m => m !== model);
      if (prev.length >= 3) return prev;
      return [...prev, model];
    });
    Haptics.selectionAsync();
  }, []);

  const compareData = useMemo(() => {
    if (compareFixtures.length < 2) return null;
    const throwDist = 3;
    const calc = new LightingCalculator();
    return compareFixtures.map(model => {
      const data = LightingCalculator.getFixtureData(model);
      const result = calc.calculateRadiometricData(model, throwDist, 0, 6, 3);
      const hasResult = !('error' in result);
      return {
        model,
        peakMW: data?.peak_irradiance_mWm2 ?? 0,
        beamH: data?.beam_h_deg ?? 0,
        beamV: data?.beam_v_deg ?? 0,
        irradiance: hasResult ? result.irradiance_report.irradiance_mWm2 : 0,
        beamArea: hasResult ? result.irradiance_report.beam_area_m2 : 0,
        category: getFixtureCategory(model),
        control: getFixtureControlType(model),
      };
    });
  }, [compareFixtures]);

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
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={[styles.compareToggle, compareMode && styles.compareToggleActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCompareMode(!compareMode);
              if (compareMode) { setCompareFixtures([]); }
            }}
            activeOpacity={0.7}
          >
            <GitCompareArrows size={14} color={compareMode ? colors.primary : colors.textSecondary} />
            <Text style={[styles.compareToggleText, compareMode && { color: colors.primary }]}>
              {compareMode ? `Compare (${compareFixtures.length})` : 'Compare'}
            </Text>
          </TouchableOpacity>
          {hasFilters && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters} activeOpacity={0.7}>
              <X size={14} color={colors.error} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
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
                    <View key={model} style={styles.fixtureCardWrap}>
                      {compareMode && (
                        <TouchableOpacity
                          style={[styles.compareCheckbox, compareFixtures.includes(model) && styles.compareCheckboxActive]}
                          onPress={() => toggleCompareFixture(model)}
                          activeOpacity={0.7}
                        >
                          {compareFixtures.includes(model) && <Check size={12} color="#fff" strokeWidth={3} />}
                        </TouchableOpacity>
                      )}
                      <View style={{ flex: 1 }}>
                        <FixtureCard
                          model={model}
                          isSelected={selectedFixture === model}
                          onSelect={() => {
                            if (compareMode) {
                              toggleCompareFixture(model);
                            } else {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedFixture(model);
                            }
                          }}
                          onDetail={() => setDetailFixture(model)}
                        />
                      </View>
                    </View>
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

      {compareMode && compareFixtures.length >= 2 && (
        <View style={styles.compareBar}>
          <Text style={styles.compareBarText}>{compareFixtures.length} fixtures selected</Text>
          <TouchableOpacity
            style={styles.compareBarBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCompareModal(true); }}
            activeOpacity={0.7}
          >
            <GitCompareArrows size={14} color="#fff" />
            <Text style={styles.compareBarBtnText}>Compare</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCompareModal} transparent animationType="slide" onRequestClose={() => setShowCompareModal(false)}>
        <Pressable style={styles.compareOverlay} onPress={() => setShowCompareModal(false)}>
          <Pressable style={[styles.compareSheet, { backgroundColor: colors.background }]} onPress={() => {}}>
            <View style={styles.compareSheetHandle} />
            <View style={styles.compareSheetHeader}>
              <Text style={[styles.compareSheetTitle, { color: colors.text }]}>Fixture Comparison</Text>
              <TouchableOpacity onPress={() => setShowCompareModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.compareSheetSub, { color: colors.textTertiary }]}>At 3m throw distance, 6×3m target</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.compareScrollContent}>
              {compareData && (
                <View style={styles.compareTable}>
                  <View style={[styles.compareRow, styles.compareHeaderRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.compareCell, styles.compareLabelCell, { color: colors.textTertiary }]}>Metric</Text>
                    {compareData.map(d => (
                      <Text key={d.model} style={[styles.compareCell, styles.compareHeaderCell, { color: colors.text }]}>{d.model}</Text>
                    ))}
                  </View>
                  {[
                    { label: 'Peak mW/m²', key: 'peakMW' as const, fmt: (v: number) => v.toFixed(0) },
                    { label: '@3m mW/m²', key: 'irradiance' as const, fmt: (v: number) => v.toFixed(0) },
                    { label: 'Beam Area m²', key: 'beamArea' as const, fmt: (v: number) => v.toFixed(1) },
                    { label: 'Beam H°', key: 'beamH' as const, fmt: (v: number) => v.toFixed(0) + '°' },
                    { label: 'Beam V°', key: 'beamV' as const, fmt: (v: number) => v.toFixed(0) + '°' },
                  ].map(row => {
                    const values = compareData.map(d => d[row.key]);
                    const maxVal = Math.max(...values);
                    return (
                      <View key={row.label} style={[styles.compareRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.compareCell, styles.compareLabelCell, { color: colors.textSecondary }]}>{row.label}</Text>
                        {compareData.map(d => {
                          const isBest = d[row.key] === maxVal && values.filter(v => v === maxVal).length === 1;
                          return (
                            <Text key={d.model} style={[styles.compareCell, { color: isBest ? colors.success : colors.text, fontWeight: isBest ? '700' as const : '500' as const }]}>
                              {row.fmt(d[row.key])}
                            </Text>
                          );
                        })}
                      </View>
                    );
                  })}
                  <View style={[styles.compareRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.compareCell, styles.compareLabelCell, { color: colors.textSecondary }]}>Control</Text>
                    {compareData.map(d => (
                      <Text key={d.model} style={[styles.compareCell, { color: colors.text }]}>{d.control}</Text>
                    ))}
                  </View>
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContainer: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
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
    topBarActions: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    compareToggle: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    compareToggleActive: { borderColor: colors.primary + '40', backgroundColor: colors.glow },
    compareToggleText: { fontSize: 11, fontWeight: '600' as const, color: colors.textSecondary },
    fixtureCardWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    compareCheckbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.border, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: colors.surface },
    compareCheckboxActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    compareBar: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    compareBarText: { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary },
    compareBarBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, backgroundColor: colors.primary },
    compareBarBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#fff' },
    compareOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' as const },
    compareSheet: { maxHeight: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    compareSheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center' as const, marginBottom: 16 },
    compareSheetHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 4 },
    compareSheetTitle: { fontSize: 18, fontWeight: '700' as const },
    compareSheetSub: { fontSize: 12, marginBottom: 16 },
    compareScrollContent: { flex: 1 },
    compareTable: {},
    compareRow: { flexDirection: 'row' as const, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
    compareHeaderRow: { paddingBottom: 8 },
    compareCell: { flex: 1, fontSize: 13, textAlign: 'center' as const },
    compareLabelCell: { textAlign: 'left' as const, fontWeight: '500' as const },
    compareHeaderCell: { fontWeight: '700' as const, fontSize: 12 },
    footer: { alignItems: 'center', paddingVertical: 28 },
    footerDivider: { width: 32, height: 2, borderRadius: 1, backgroundColor: colors.border, marginBottom: 14 },
    footerText: { fontSize: 11, color: colors.textTertiary },
    footerBrand: { color: colors.primary, fontWeight: '700' as const },
  });
}
