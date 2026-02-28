import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lightbulb, ChevronRight, Zap, Radio } from 'lucide-react-native';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { getFixtureControlType, getFixtureSeries } from '@/utils/fixture-helpers';

interface Props {
  model: string;
  isSelected: boolean;
  onSelect: () => void;
  onDetail: () => void;
}

export function FixtureCard({ model, isSelected, onSelect, onDetail }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const data = LightingCalculator.getFixtureData(model);
  const controlType = getFixtureControlType(model);
  const series = getFixtureSeries(model);
  const isDMX = controlType.includes('DMX');

  const powerBand =
    !data ? '—'
    : data.peak_irradiance_mWm2 > 10000 ? 'High'
    : data.peak_irradiance_mWm2 > 1000 ? 'Med'
    : 'Low';

  const beamType =
    !data ? '—'
    : data.beam_h_deg > 100 ? 'Wide'
    : data.beam_h_deg > 40 ? 'Medium'
    : 'Narrow';

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.75}>
      <View style={[styles.card, isSelected && styles.selectedCard]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
            <Lightbulb size={16} color={isSelected ? colors.primary : colors.textTertiary} />
          </View>
          <View style={styles.nameWrap}>
            <Text style={[styles.model, isSelected && styles.modelSelected]}>{model}</Text>
            <Text style={styles.series}>{series}</Text>
          </View>
          <View style={[styles.ctrlBadge, { backgroundColor: isDMX ? 'rgba(155, 109, 255, 0.1)' : 'rgba(34, 197, 94, 0.1)' }]}>
            {isDMX
              ? <Radio size={10} color="#9B6DFF" />
              : <Zap size={10} color="#22C55E" />}
            <Text style={[styles.ctrlText, { color: isDMX ? '#9B6DFF' : '#22C55E' }]}>
              {isDMX ? 'DMX' : 'On/Off'}
            </Text>
          </View>
          <TouchableOpacity onPress={onDetail} style={styles.detailBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {data && (
          <View style={styles.chips}>
            <Chip label="Beam" value={`${data.beam_h_deg}°`} colors={colors} />
            {data.field_h_deg != null && <Chip label="Field" value={`${data.field_h_deg}°`} colors={colors} />}
            <Chip label="Irr@1m" value={`${(data.peak_irradiance_mWm2 / 1000).toFixed(1)} W/m²`} colors={colors} />
            <Chip label="Type" value={beamType} colors={colors} />
            <Chip label="Output" value={powerBand} colors={colors} />
          </View>
        )}

        {isSelected && (
          <View style={styles.selectedBanner}>
            <Text style={styles.selectedBannerText}>Currently Selected</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Chip({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontSize: 10, color: colors.textTertiary, marginBottom: 1, fontWeight: '500' as const }}>{label}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700' as const, color: colors.text }}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedCard: {
      borderColor: colors.primary,
      backgroundColor: colors.glow,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconWrapSelected: { backgroundColor: 'rgba(232, 65, 42, 0.08)' },
    nameWrap: { flex: 1 },
    model: { fontSize: 14, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.1 },
    modelSelected: { color: colors.primary },
    series: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
    ctrlBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    ctrlText: { fontSize: 10, fontWeight: '700' as const },
    detailBtn: { padding: 4 },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    selectedBanner: {
      marginTop: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 6,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    selectedBannerText: { fontSize: 12, color: '#fff', fontWeight: '700' as const },
  });
}
