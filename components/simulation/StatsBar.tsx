import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { DOSE_THRESHOLDS } from '@/types/lighting';
import { ThemeColors } from '@/constants/theme';
import { getSafetyColor, getDoseColor, computeDoseMJcm2, HeatmapStats } from './types';

interface StatsBarProps {
  stats: { maxIrr: number; avgIrr: number; minIrr: number; safety: string; coverage: number };
  colors: ThemeColors;
}

export const StatsBar = React.memo(({ stats, colors }: StatsBarProps) => {
  const s = styles(colors);
  return (
    <View style={s.statsBar}>
      <View style={s.statItem}>
        <Text style={s.statsLabel}>MIN</Text>
        <Text style={s.statsValue}>{stats.minIrr}</Text>
        <Text style={s.statsUnit}>mW/m²</Text>
      </View>
      <View style={s.statItem}>
        <Text style={s.statsLabel}>MAX</Text>
        <Text style={[s.statsValue, { color: getSafetyColor(stats.maxIrr) }]}>{stats.maxIrr}</Text>
        <Text style={s.statsUnit}>mW/m²</Text>
      </View>
      <View style={s.statItem}>
        <Text style={s.statsLabel}>AVG</Text>
        <Text style={s.statsValue}>{stats.avgIrr}</Text>
        <Text style={s.statsUnit}>mW/m²</Text>
      </View>
      <View style={s.statItem}>
        <Text style={s.statsLabel}>SAFETY</Text>
        <Text style={[s.statsValue, { color: getSafetyColor(stats.maxIrr) }]}>{stats.safety}</Text>
      </View>
      <View style={s.statItem}>
        <Text style={s.statsLabel}>COVER</Text>
        <Text style={s.statsValue}>{stats.coverage}%</Text>
      </View>
    </View>
  );
});

StatsBar.displayName = 'StatsBar';

interface DoseBarProps {
  maxDose: number;
  avgDose: number;
  safeMinutes: number;
  exposureMinutes: number;
  colors: ThemeColors;
}

export const DoseBar = React.memo(({ maxDose, avgDose, safeMinutes, exposureMinutes, colors }: DoseBarProps) => {
  const s = styles(colors);
  return (
    <View style={s.doseBar}>
      <View style={s.doseBarHeader}>
        <Clock size={12} color={colors.textSecondary} />
        <Text style={s.doseBarTitle}>UV Dose ({exposureMinutes} min)</Text>
      </View>
      <View style={s.doseBarStats}>
        <View style={s.statItem}>
          <Text style={s.statsLabel}>MAX</Text>
          <Text style={[s.statsValue, { color: getDoseColor(maxDose) }]}>{maxDose}</Text>
          <Text style={s.statsUnit}>mJ/cm²</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statsLabel}>AVG</Text>
          <Text style={s.statsValue}>{avgDose}</Text>
          <Text style={s.statsUnit}>mJ/cm²</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statsLabel}>TLV</Text>
          <Text style={s.statsValue}>{DOSE_THRESHOLDS.acgih_tlv_365nm}</Text>
          <Text style={s.statsUnit}>mJ/cm²</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statsLabel}>SAFE TIME</Text>
          <Text style={[s.statsValue, { color: safeMinutes < exposureMinutes ? '#EF4444' : '#22C55E' }]}>
            {safeMinutes === Infinity ? '--' : `${safeMinutes}m`}
          </Text>
        </View>
      </View>
      {maxDose > DOSE_THRESHOLDS.acgih_tlv_365nm && (
        <View style={s.doseWarning}>
          <Text style={s.doseWarningText}>
            Exceeds ACGIH TLV for 365nm UV-A. Max safe exposure: {safeMinutes === Infinity ? '--' : `${safeMinutes} min`}
          </Text>
        </View>
      )}
    </View>
  );
});

DoseBar.displayName = 'DoseBar';

const stylesCache = new WeakMap<ThemeColors, ReturnType<typeof createStyles>>();

function styles(colors: ThemeColors) {
  let cached = stylesCache.get(colors);
  if (!cached) {
    cached = createStyles(colors);
    stylesCache.set(colors, cached);
  }
  return cached;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    statsBar: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceSecondary,
    },
    statItem: {
      alignItems: 'center',
      gap: 2,
    },
    statsLabel: {
      fontSize: 10,
      color: colors.textTertiary,
      fontWeight: '700' as const,
    },
    statsValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '700' as const,
    },
    statsUnit: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    doseBar: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceSecondary,
    },
    doseBarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    doseBarTitle: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: colors.textSecondary,
    },
    doseBarStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    doseWarning: {
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    doseWarningText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: '#EF4444',
      textAlign: 'center' as const,
    },
  });
}
