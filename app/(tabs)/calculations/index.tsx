import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { History, Search, Filter, Trash2, Eye, X, FileText, Zap, FileDown, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLightingStore, SavedCalculation } from '@/stores/lighting-store';
import { ResultCard } from '@/components/ResultCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Logo } from '@/components/ui/Logo';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportCalculationAsText } from '@/utils/file-helpers';

export default function CalculationsScreen() {
  const { savedCalculations, deleteCalculation, loadCalculation } = useLightingStore();
  const [selectedCalculation, setSelectedCalculation] = useState<SavedCalculation | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFixture, setFilterFixture] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const fixtureModels = useMemo(() => ['', ...LightingCalculator.getFixtureModels()], []);
  const sortOptions = useMemo(() => ['newest', 'oldest', 'name', 'fixture'], []);

  const getSafetyColor = useCallback((level: string) => {
    switch (level) {
      case 'safe': return theme.colors.success;
      case 'caution': return theme.colors.warning;
      case 'warning': return theme.colors.safetyOrange;
      case 'danger': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  }, []);

  const formatDate = useCallback((ts: number) =>
    new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }), []);

  const filteredCalculations = useMemo(() => {
    let list = savedCalculations.filter(c => {
      if (filterFixture && c.fixture !== filterFixture) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.fixture.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false) || (c.projectId?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
    list.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return a.timestamp - b.timestamp;
        case 'name': return a.name.localeCompare(b.name);
        case 'fixture': return a.fixture.localeCompare(b.fixture);
        default: return b.timestamp - a.timestamp;
      }
    });
    return list;
  }, [savedCalculations, searchQuery, filterFixture, sortBy]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterFixture('');
    setSortBy('newest');
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Calculation', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCalculation(id) },
    ]);
  }, [deleteCalculation]);

  const renderItem = useCallback(({ item }: { item: SavedCalculation }) => {
    const hasReport = 'irradiance_report' in item.result;
    return (
      <TouchableOpacity
        style={styles.calcCard}
        onPress={() => setSelectedCalculation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.calcTop}>
          <View style={styles.calcInfo}>
            <Text style={styles.calcName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.calcMeta}>{item.fixture} · {formatDate(item.timestamp)}</Text>
            {item.projectId ? <Text style={styles.projectTag}>#{item.projectId}</Text> : null}
          </View>
          <View style={[styles.safetyPill, { backgroundColor: getSafetyColor(item.safetyLevel) + '14' }]}>
            <View style={[styles.safetyDot, { backgroundColor: getSafetyColor(item.safetyLevel) }]} />
            <Text style={[styles.safetyLabel, { color: getSafetyColor(item.safetyLevel) }]}>
              {item.safetyLevel.toUpperCase()}
            </Text>
          </View>
        </View>
        {hasReport && (
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{(item.result as any).irradiance_report.throw_distance_m.toFixed(1)}m</Text>
              <Text style={styles.quickStatLabel}>throw</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{(item.result as any).irradiance_report.irradiance_mWm2.toFixed(0)}</Text>
              <Text style={styles.quickStatLabel}>mW/m²</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{(item.result as any).irradiance_report.beam_area_m2.toFixed(1)}m²</Text>
              <Text style={styles.quickStatLabel}>area</Text>
            </View>
          </View>
        )}
        <View style={styles.calcActions}>
          <TouchableOpacity style={styles.actionChip} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            loadCalculation(item.id);
            Alert.alert('Loaded', 'Switch to Calculator tab to see the result.');
          }} activeOpacity={0.7}>
            <Zap size={13} color={theme.colors.secondary} />
            <Text style={[styles.actionChipText, { color: theme.colors.secondary }]}>Load</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={async () => {
            if (hasReport) {
              const result = await exportCalculationAsText(
                item.name, item.fixture, item.inputs,
                item.result as Record<string, any>, item.safetyLevel,
              );
              if (!result.success) Alert.alert('Error', result.error ?? 'Export failed');
            }
          }} activeOpacity={0.7}>
            <FileDown size={13} color={theme.colors.success} />
            <Text style={[styles.actionChipText, { color: theme.colors.success }]}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => handleDelete(item.id, item.name)} activeOpacity={0.7}>
            <Trash2 size={13} color={theme.colors.error} />
            <Text style={[styles.actionChipText, { color: theme.colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [formatDate, getSafetyColor, loadCalculation, handleDelete]);

  if (selectedCalculation != null && 'irradiance_report' in selectedCalculation.result) {
    const { irradiance_report, beam_calculators } = selectedCalculation.result;
    const numeric = (data: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(data).filter(([, v]) => typeof v === 'number' && !isNaN(v as number))
      ) as Record<string, number>;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.detailTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedCalculation(null)} activeOpacity={0.7}>
            <ChevronRight size={20} color={theme.colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Button
            title="Export"
            onPress={async () => {
              const result = await exportCalculationAsText(
                selectedCalculation.name,
                selectedCalculation.fixture,
                selectedCalculation.inputs,
                selectedCalculation.result as Record<string, any>,
                selectedCalculation.safetyLevel,
              );
              if (result.success) Alert.alert('Exported', 'Report exported successfully.');
              else Alert.alert('Error', result.error ?? 'Export failed');
            }}
            variant="secondary"
            size="small"
            icon={<FileDown size={14} color={theme.colors.text} />}
          />
        </View>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedCalculation.name}</Text>
            <Text style={styles.detailSubtitle}>{selectedCalculation.fixture} · {formatDate(selectedCalculation.timestamp)}</Text>
            {selectedCalculation.description ? <Text style={styles.detailDesc}>{selectedCalculation.description}</Text> : null}
          </View>
          <View style={styles.summaryGrid}>
            {([
              ['Throw Distance', `${irradiance_report.throw_distance_m.toFixed(2)} m`],
              ['Beam Area', `${irradiance_report.beam_area_m2.toFixed(2)} m²`],
              ['Irradiance', `${irradiance_report.irradiance_mWm2.toFixed(2)} mW/m²`],
              ['Safety', selectedCalculation.safetyLevel.toUpperCase()],
            ] as const).map(([label, value]) => (
              <View key={label} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={[styles.summaryValue, label === 'Safety' ? { color: getSafetyColor(selectedCalculation.safetyLevel) } : null]}>{value}</Text>
              </View>
            ))}
          </View>
          <ResultCard title="Irradiance Report" data={numeric(irradiance_report as unknown as Record<string, unknown>)} />
          <ResultCard title="Beam Calculators" data={numeric(beam_calculators as unknown as Record<string, unknown>)} />
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>Powered by <Text style={styles.footerBrand}>JABVLabs</Text></Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.titleIcon}>
            <History size={16} color={theme.colors.secondary} />
          </View>
          <Text style={styles.screenTitle}>History</Text>
        </View>
        <Text style={styles.countBadge}>{savedCalculations.length}</Text>
      </View>

      <View style={styles.searchSection}>
        <Input label="" value={searchQuery} onChangeText={setSearchQuery} placeholder="Search calculations..." />
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterToggle, showFilters && styles.filterToggleActive]} onPress={() => setShowFilters(!showFilters)} activeOpacity={0.7}>
            <Filter size={14} color={showFilters ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>{showFilters ? 'Hide' : 'Filters'}</Text>
          </TouchableOpacity>
          {(searchQuery || filterFixture) ? (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.7}>
              <X size={13} color={theme.colors.error} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {showFilters && (
          <View style={styles.filtersCard}>
            <Picker label="Fixture" value={filterFixture || 'All'} options={fixtureModels.map(f => f || 'All')} onValueChange={(v) => setFilterFixture(v === 'All' ? '' : v)} />
            <Picker label="Sort By" value={sortBy} options={sortOptions} onValueChange={setSortBy} />
          </View>
        )}
      </View>

      {filteredCalculations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <History size={36} color={theme.colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>
            {savedCalculations.length === 0 ? 'No Saved Calculations' : 'No Results Found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {savedCalculations.length === 0
              ? 'Run a calculation, then tap Save.'
              : 'Try adjusting your search or filters.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCalculations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.calcList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.select({ ios: 40, android: 120, default: 40 }) }}
        />
      )}
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
    gap: 10,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  countBadge: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchSection: { paddingHorizontal: 16, paddingTop: 12, marginBottom: 4 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  filterToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  filterToggleActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.glow },
  filterToggleText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' as const },
  filterToggleTextActive: { color: theme.colors.primary },
  clearButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12 },
  clearButtonText: { fontSize: 12, color: theme.colors.error, fontWeight: '600' as const },
  filtersCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calcList: { flex: 1, paddingHorizontal: 16 },
  calcCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calcTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  calcInfo: { flex: 1, marginRight: 12 },
  calcName: { fontSize: 16, fontWeight: '700' as const, color: theme.colors.text, marginBottom: 3, letterSpacing: -0.2 },
  calcMeta: { fontSize: 12, color: theme.colors.textSecondary },
  projectTag: { fontSize: 11, color: theme.colors.accent, marginTop: 3, fontWeight: '600' as const },
  safetyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  safetyDot: { width: 6, height: 6, borderRadius: 3 },
  safetyLabel: { fontSize: 9, fontWeight: '800' as const, letterSpacing: 0.5 },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text },
  quickStatLabel: { fontSize: 10, color: theme.colors.textTertiary, marginTop: 2 },
  quickStatDivider: { width: 1, height: 24, backgroundColor: theme.colors.border },
  calcActions: { flexDirection: 'row', gap: 8 },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, backgroundColor: theme.colors.surfaceSecondary,
  },
  actionChipText: { fontSize: 11, fontWeight: '600' as const },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: theme.colors.text, textAlign: 'center' as const },
  emptySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 8, lineHeight: 20 },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, color: theme.colors.text, fontWeight: '600' as const },
  detailHeader: { alignItems: 'center', padding: 20 },
  detailTitle: { fontSize: 22, fontWeight: '800' as const, color: theme.colors.text, textAlign: 'center' as const, letterSpacing: -0.3 },
  detailSubtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 4 },
  detailDesc: { fontSize: 14, color: theme.colors.text, textAlign: 'center' as const, marginTop: 8, fontStyle: 'italic' as const },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  summaryItem: {
    flex: 1, minWidth: '45%',
    backgroundColor: theme.colors.surface, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  summaryLabel: { fontSize: 11, color: theme.colors.textTertiary, marginBottom: 4, fontWeight: '500' as const, letterSpacing: 0.3 },
  summaryValue: { fontSize: 15, color: theme.colors.text, fontWeight: '700' as const },
  footer: { alignItems: 'center', paddingVertical: 28 },
  footerDivider: { width: 32, height: 2, borderRadius: 1, backgroundColor: theme.colors.border, marginBottom: 14 },
  footerText: { fontSize: 11, color: theme.colors.textTertiary },
  footerBrand: { color: theme.colors.primary, fontWeight: '700' as const },
});
