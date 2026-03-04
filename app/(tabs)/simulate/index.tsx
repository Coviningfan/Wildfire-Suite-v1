import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Layers, Plus, Trash2, RotateCcw, Box, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { useSimulationStore } from '@/stores/simulation-store';
import { useSettingsStore, distanceUnit, areaUnit, convertArea } from '@/stores/settings-store';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { RoomSimulation } from '@/components/RoomSimulation';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { CalculationResponse } from '@/types/lighting';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SimulateScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { unitSystem } = useSettingsStore();
  const dUnit = distanceUnit(unitSystem);
  const aUnit = areaUnit(unitSystem);

  const {
    zoneFixtures,
    roomWidth,
    roomDepth,
    roomCeiling,
    addBlankFixture,
    removeFixture,
    updateFixture,
    updateFixturePosition,
    setRoomWidth,
    setRoomDepth,
    setRoomCeiling,
    clearFixtures,
  } = useSimulationStore();

  const [expandedFixtures, setExpandedFixtures] = useState<Record<string, boolean>>({});
  const [showRoomDims, setShowRoomDims] = useState(false);

  const fixtureModels = useMemo(() => LightingCalculator.getFixtureModels(), []);

  const toggleFixtureExpanded = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFixtures((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleRoomDims = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowRoomDims((prev) => !prev);
  }, []);

  const handleClearAll = useCallback(() => {
    if (zoneFixtures.length === 0) return;
    Alert.alert('Clear All Fixtures', 'Remove all fixtures from the simulation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearFixtures();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [zoneFixtures.length, clearFixtures]);

  const handleAddFixture = useCallback(() => {
    const newId = `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    addBlankFixture(newId);
    setExpandedFixtures((prev) => ({ ...prev, [newId]: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [addBlankFixture]);

  const handleRemoveFixture = useCallback(
    (id: string) => {
      removeFixture(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [removeFixture],
  );

  const zoneResults = useMemo(() => {
    if (zoneFixtures.length === 0) return null;
    const calc = new LightingCalculator();
    const results: Exclude<CalculationResponse, { error: string }>[] = [];
    for (const zf of zoneFixtures) {
      if (!zf.fixture) continue;
      const result = calc.calculateRadiometricData(
        zf.fixture,
        parseFloat(zf.verticalHeight) || 0,
        parseFloat(zf.horizontalDistance) || 0,
        parseFloat(zf.beamWidth || '') || 12,
        parseFloat(zf.beamHeight || '') || 12,
      );
      if (!('error' in result)) {
        results.push(result);
      }
    }
    if (results.length === 0) return null;
    const totalArea = results.reduce((s, r) => s + r.irradiance_report.beam_area_m2, 0);
    const avgIrradiance =
      results.reduce((s, r) => s + r.irradiance_report.irradiance_mWm2, 0) / results.length;
    const maxIrradiance = Math.max(...results.map((r) => r.irradiance_report.irradiance_mWm2));
    return { count: results.length, totalArea, avgIrradiance, maxIrradiance };
  }, [zoneFixtures]);

  const getFixtureSummary = useCallback((zf: typeof zoneFixtures[0]) => {
    if (!zf.fixture) return 'No model selected';
    const height = zf.verticalHeight ? `${zf.verticalHeight}${dUnit}` : '';
    return [zf.fixture, height].filter(Boolean).join(' · ');
  }, [dUnit]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.iconWrap}>
            <Box size={18} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.topTitle}>Room Simulation</Text>
            <Text style={styles.topSubtitle}>
              {zoneFixtures.length === 0
                ? 'Add fixtures to begin'
                : `${zoneFixtures.length} fixture${zoneFixtures.length !== 1 ? 's' : ''} in zone`}
            </Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          {zoneFixtures.length > 0 && (
            <TouchableOpacity
              style={styles.topBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <RotateCcw size={17} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <TouchableOpacity style={styles.roomDimsHeader} onPress={toggleRoomDims} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>Room Dimensions</Text>
            <View style={styles.roomDimsSummary}>
              {!showRoomDims && (
                <Text style={styles.roomDimsSummaryText}>
                  {roomWidth || '—'} × {roomDepth || '—'} × {roomCeiling || '—'} {dUnit}
                </Text>
              )}
              {showRoomDims ? (
                <ChevronUp size={16} color={colors.textTertiary} />
              ) : (
                <ChevronDown size={16} color={colors.textTertiary} />
              )}
            </View>
          </TouchableOpacity>
          {showRoomDims && (
            <View style={styles.roomDimsCard}>
              <View style={styles.inputRow}>
                <View style={styles.inputThird}>
                  <Input
                    label={`Width (${dUnit})`}
                    value={roomWidth}
                    onChangeText={setRoomWidth}
                    keyboardType="decimal-pad"
                    placeholder="12"
                  />
                </View>
                <View style={styles.inputThird}>
                  <Input
                    label={`Depth (${dUnit})`}
                    value={roomDepth}
                    onChangeText={setRoomDepth}
                    keyboardType="decimal-pad"
                    placeholder="8"
                  />
                </View>
                <View style={styles.inputThird}>
                  <Input
                    label={`Ceiling (${dUnit})`}
                    value={roomCeiling}
                    onChangeText={setRoomCeiling}
                    keyboardType="decimal-pad"
                    placeholder="4"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <RoomSimulation
            roomWidth={parseFloat(roomWidth) || 0}
            roomDepth={parseFloat(roomDepth) || 0}
            roomHeight={parseFloat(roomCeiling) || 0}
            fixtures={zoneFixtures}
            unitLabel={dUnit}
            onFixturePositionChange={updateFixturePosition}
          />
        </View>

        {zoneResults && (
          <View style={styles.section}>
            <View style={styles.zoneSummaryCard}>
              <Text style={styles.zoneSummaryTitle}>
                Zone Summary ({zoneResults.count} fixture{zoneResults.count !== 1 ? 's' : ''})
              </Text>
              <View style={styles.zoneSummaryRow}>
                <View style={styles.zoneSummaryStat}>
                  <Text style={styles.zoneSummaryValue}>
                    {convertArea(zoneResults.totalArea, unitSystem).toFixed(1)}
                  </Text>
                  <Text style={styles.zoneSummaryLabel}>Total Area ({aUnit})</Text>
                </View>
                <View style={styles.zoneSummaryStat}>
                  <Text style={styles.zoneSummaryValue}>
                    {zoneResults.avgIrradiance.toFixed(0)}
                  </Text>
                  <Text style={styles.zoneSummaryLabel}>Avg mW/m²</Text>
                </View>
                <View style={styles.zoneSummaryStat}>
                  <Text style={styles.zoneSummaryValue}>
                    {zoneResults.maxIrradiance.toFixed(0)}
                  </Text>
                  <Text style={styles.zoneSummaryLabel}>Peak mW/m²</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fixtures</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddFixture} activeOpacity={0.7}>
              <Plus size={14} color={colors.primary} />
              <Text style={styles.addBtnText}>Add Fixture</Text>
            </TouchableOpacity>
          </View>
          {zoneFixtures.length === 0 && (
            <View style={styles.emptyFixtures}>
              <Layers size={24} color={colors.textTertiary} />
              <Text style={styles.emptyFixturesText}>
                No fixtures yet. Add fixtures manually or use "Add to Simulation" from the Calculator tab.
              </Text>
            </View>
          )}
          {zoneFixtures.map((zf, idx) => {
            const isExpanded = expandedFixtures[zf.id] ?? false;
            return (
              <View key={zf.id} style={styles.fixtureCard}>
                <View style={styles.fixtureCardHeader}>
                  <TouchableOpacity
                    style={styles.fixtureCardHeaderLeft}
                    onPress={() => toggleFixtureExpanded(zf.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.fixtureColorDot, { backgroundColor: ['#E8412A', '#3B9FE8', '#22C55E', '#F5A623', '#7C6BF0', '#F97316'][idx % 6] }]} />
                    <View style={styles.fixtureCardLabelWrap}>
                      <Text style={styles.fixtureCardLabel}>Fixture {idx + 1}</Text>
                      {!isExpanded && (
                        <Text style={styles.fixtureCardSummary} numberOfLines={1}>{getFixtureSummary(zf)}</Text>
                      )}
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color={colors.textTertiary} />
                    ) : (
                      <ChevronDown size={16} color={colors.textTertiary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveFixture(zf.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={13} color={colors.error} />
                  </TouchableOpacity>
                </View>
                {isExpanded && (
                  <View style={styles.fixtureCardBody}>
                    <Picker
                      label="Model"
                      value={zf.fixture}
                      options={fixtureModels}
                      onValueChange={(v) => updateFixture(zf.id, 'fixture', v)}
                    />
                    <View style={styles.inputRow}>
                      <View style={styles.inputHalf}>
                        <Input
                          label="Height"
                          value={zf.verticalHeight}
                          onChangeText={(v) => updateFixture(zf.id, 'verticalHeight', v)}
                          keyboardType="decimal-pad"
                          unit={dUnit}
                          placeholder="0.0"
                        />
                      </View>
                      <View style={styles.inputHalf}>
                        <Input
                          label="H. Dist"
                          value={zf.horizontalDistance}
                          onChangeText={(v) => updateFixture(zf.id, 'horizontalDistance', v)}
                          keyboardType="decimal-pad"
                          unit={dUnit}
                          placeholder="0.0"
                        />
                      </View>
                    </View>
                    <View style={styles.inputRow}>
                      <View style={styles.inputHalf}>
                        <Input
                          label="Beam Width"
                          value={zf.beamWidth || ''}
                          onChangeText={(v) => updateFixture(zf.id, 'beamWidth', v)}
                          keyboardType="decimal-pad"
                          unit={dUnit}
                          placeholder="6.0"
                        />
                      </View>
                      <View style={styles.inputHalf}>
                        <Input
                          label="Beam Height"
                          value={zf.beamHeight || ''}
                          onChangeText={(v) => updateFixture(zf.id, 'beamHeight', v)}
                          keyboardType="decimal-pad"
                          unit={dUnit}
                          placeholder="3.0"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: 'rgba(124, 107, 240, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    topTitle: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    topSubtitle: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    topBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    section: { paddingHorizontal: 16, marginTop: 16 },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    roomDimsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    roomDimsSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    roomDimsSummaryText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    roomDimsCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputRow: { flexDirection: 'row', gap: 10 },
    inputThird: { flex: 1 },
    inputHalf: { flex: 1 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.glow,
      borderWidth: 1,
      borderColor: 'rgba(232, 65, 42, 0.2)',
    },
    addBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    emptyFixtures: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 24,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    emptyFixturesText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
    },
    fixtureCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    fixtureCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    fixtureCardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    fixtureCardLabelWrap: {
      flex: 1,
    },
    fixtureColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    fixtureCardLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
    fixtureCardSummary: { fontSize: 11, color: colors.textTertiary, marginTop: 1, maxWidth: 200 },
    fixtureCardHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    deleteBtn: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fixtureCardBody: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      gap: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    zoneSummaryCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    zoneSummaryTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
    zoneSummaryRow: { flexDirection: 'row', gap: 8 },
    zoneSummaryStat: { flex: 1, alignItems: 'center' },
    zoneSummaryValue: { fontSize: 18, fontWeight: '800', color: colors.text },
    zoneSummaryLabel: {
      fontSize: 10,
      color: colors.textTertiary,
      marginTop: 2,
      textAlign: 'center',
    },
  });
}
