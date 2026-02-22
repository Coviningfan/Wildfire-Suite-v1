import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { History, Search, Filter, Trash2, Eye, X, FileText, Zap, FileDown } from 'lucide-react-native';
import { useLightingStore, SavedCalculation } from '@/stores/lighting-store';
import { ResultCard } from '@/components/ResultCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Logo } from '@/components/ui/Logo';
import { PoweredBy } from '@/components/ui/PoweredBy';
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
      month: 'short', day: 'numeric', year: 'numeric',
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
    Alert.alert('Delete Calculation', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCalculation(id) },
    ]);
  }, [deleteCalculation]);

  const renderItem = useCallback(({ item }: { item: SavedCalculation }) => (
    <TouchableOpacity style={styles.calcItem} onPress={() => setSelectedCalculation(item)} activeOpacity={0.7}>
      <View style={styles.calcHeader}>
        <View style={styles.calcInfo}>
          <Text style={styles.calcName}>{item.name}</Text>
          <Text style={styles.calcDetails}>{item.fixture} · {formatDate(item.timestamp)}</Text>
          {item.projectId ? <Text style={styles.projectId}>Project: {item.projectId}</Text> : null}
          {'irradiance_report' in item.result && (
            <View style={styles.quickStatsRow}>
              <Text style={styles.quickStats}>
                {item.result.irradiance_report.throw_distance_m.toFixed(1)}m throw
              </Text>
              <View style={styles.quickStatDot} />
              <Text style={styles.quickStats}>
                {item.result.irradiance_report.irradiance_mWm2.toFixed(0)} mW/m²
              </Text>
            </View>
          )}
        </View>
        <View style={styles.calcMeta}>
          <View style={[styles.safetyPill, { backgroundColor: getSafetyColor(item.safetyLevel) + '18' }]}>
            <View style={[styles.safetyDot, { backgroundColor: getSafetyColor(item.safetyLevel) }]} />
            <Text style={[styles.safetyLabel, { color: getSafetyColor(item.safetyLevel) }]}>
              {item.safetyLevel.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.calcActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedCalculation(item)} activeOpacity={0.7}>
          <Eye size={14} color={theme.colors.accent} />
          <Text style={[styles.actionText, { color: theme.colors.accent }]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {
          loadCalculation(item.id);
          Alert.alert('Loaded', 'Switch to the Calculator tab to see the result.');
        }} activeOpacity={0.7}>
          <Zap size={14} color={theme.colors.secondary} />
          <Text style={[styles.actionText, { color: theme.colors.secondary }]}>Load</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={async () => {
          if ('irradiance_report' in item.result) {
            const result = await exportCalculationAsText(
              item.name, item.fixture, item.inputs,
              item.result as Record<string, any>, item.safetyLevel,
            );
            if (!result.success) Alert.alert('Error', result.error ?? 'Export failed');
          }
        }} activeOpacity={0.7}>
          <FileDown size={14} color={theme.colors.success} />
          <Text style={[styles.actionText, { color: theme.colors.success }]}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.name)} activeOpacity={0.7}>
          <Trash2 size={14} color={theme.colors.error} />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [formatDate, getSafetyColor, loadCalculation, handleDelete]);

  if (selectedCalculation != null && 'irradiance_report' in selectedCalculation.result) {
    const { irradiance_report, beam_calculators } = selectedCalculation.result;
    const numeric = (data: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(data).filter(([, v]) => typeof v === 'number' && !isNaN(v as number))
      ) as Record<string, number>;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.detailHeader}>
            <Logo size="medium" />
            <View style={styles.detailIconWrap}>
              <FileText size={22} color={theme.colors.secondary} />
            </View>
            <Text style={styles.detailTitle}>{selectedCalculation.name}</Text>
            <Text style={styles.detailSubtitle}>{selectedCalculation.fixture} · {formatDate(selectedCalculation.timestamp)}</Text>
            {selectedCalculation.description ? <Text style={styles.detailDesc}>{selectedCalculation.description}</Text> : null}
          </View>
          <View style={styles.detailActions}>
            <Button title="Back" onPress={() => setSelectedCalculation(null)} variant="outline" size="medium" />
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
                if (result.success) {
                  Alert.alert('Exported', 'Report exported successfully.');
                } else {
                  Alert.alert('Error', result.error ?? 'Export failed');
                }
              }}
              variant="secondary"
              size="medium"
              icon={<FileDown size={16} color={theme.colors.text} />}
            />
            <Button title="Load" onPress={() => { loadCalculation(selectedCalculation.id); setSelectedCalculation(null); }} variant="primary" size="medium" />
          </View>
          <Card>
            <Text style={styles.summaryTitle}>Summary</Text>
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
          </Card>
          <ResultCard title="Irradiance Report" data={numeric(irradiance_report as unknown as Record<string, unknown>)} />
          <ResultCard title="Beam Calculators" data={numeric(beam_calculators as unknown as Record<string, unknown>)} />
          <PoweredBy />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.listHeader}>
        <Logo size="medium" />
        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <History size={18} color={theme.colors.secondary} />
          </View>
          <Text style={styles.title}>Calculation History</Text>
          <InfoTooltip
            title="Calculation History"
            body="All saved calculations appear here. Tap a row for the full report. Tap Load to pull a result back into the Calculator. Use filters to search."
          />
        </View>
        <Text style={styles.subtitle}>Tap any row for the full report</Text>
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
          <Card style={styles.filtersCard}>
            <Picker label="Fixture" value={filterFixture || 'All'} options={fixtureModels.map(f => f || 'All')} onValueChange={(v) => setFilterFixture(v === 'All' ? '' : v)} />
            <Picker label="Sort By" value={sortBy} options={sortOptions} onValueChange={setSortBy} />
          </Card>
        )}
        <Text style={styles.resultsCount}>{filteredCalculations.length} of {savedCalculations.length} results</Text>
      </View>

      {filteredCalculations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <History size={40} color={theme.colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>
            {savedCalculations.length === 0 ? 'No Saved Calculations Yet' : 'No Results Found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {savedCalculations.length === 0
              ? 'Run a calculation in the Calculator tab, then tap "Save Result".'
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
  listHeader: { alignItems: 'center', padding: 20, paddingTop: 14, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  titleIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '800' as const, color: theme.colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 6 },
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
  calcList: { flex: 1, paddingHorizontal: 16 },
  calcItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  calcHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  calcInfo: { flex: 1 },
  calcName: { fontSize: 16, fontWeight: '700' as const, color: theme.colors.text, marginBottom: 4, letterSpacing: -0.2 },
  calcDetails: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
  projectId: { fontSize: 11, color: theme.colors.primary, marginBottom: 2, fontWeight: '500' as const },
  quickStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  quickStatDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.textTertiary },
  quickStats: { fontSize: 12, color: theme.colors.accent, fontWeight: '600' as const },
  calcMeta: { marginLeft: 10 },
  safetyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  safetyDot: { width: 6, height: 6, borderRadius: 3 },
  safetyLabel: { fontSize: 9, fontWeight: '800' as const, letterSpacing: 0.5 },
  calcActions: { flexDirection: 'row', gap: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  actionText: { fontSize: 12, fontWeight: '600' as const },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: theme.colors.text, textAlign: 'center' as const, letterSpacing: -0.2 },
  emptySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 8, lineHeight: 20 },
  detailHeader: { alignItems: 'center', padding: 20 },
  detailIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 16, marginBottom: 8,
  },
  detailTitle: { fontSize: 22, fontWeight: '800' as const, color: theme.colors.text, textAlign: 'center' as const, letterSpacing: -0.3 },
  detailSubtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 4 },
  detailDesc: { fontSize: 14, color: theme.colors.text, textAlign: 'center' as const, marginTop: 8, fontStyle: 'italic' as const },
  detailActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text, marginBottom: 12, letterSpacing: -0.1 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: { flex: 1, minWidth: '45%', backgroundColor: theme.colors.surfaceSecondary, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  summaryLabel: { fontSize: 11, color: theme.colors.textTertiary, marginBottom: 4, fontWeight: '500' as const, letterSpacing: 0.3 },
  summaryValue: { fontSize: 15, color: theme.colors.text, fontWeight: '700' as const },
});
