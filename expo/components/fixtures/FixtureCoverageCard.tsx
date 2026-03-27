import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { SAFETY_THRESHOLDS } from '@/types/lighting';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';

interface Props {
  model: string;
  throwDistanceM: number;
}

export function FixtureCoverageCard({ model, throwDistanceM }: Props) {
  const colors = useThemeColors();
  const data = LightingCalculator.getFixtureData(model);
  const { width: screenWidth } = useWindowDimensions();
  const coneMaxWidth = screenWidth - 80;

  const calc = useMemo(() => {
    if (data == null || throwDistanceM <= 0) return null;
    const D = throwDistanceM;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const beamDiaM = 2 * D * Math.tan(toRad(data.beam_h_deg / 2));
    const beamDiaFt = beamDiaM * 3.28084;
    const beamAreaM2 = Math.PI * (beamDiaM / 2) ** 2;
    const beamAreaFt2 = beamAreaM2 * 10.7639;
    const fieldDiaM = data.field_h_deg != null ? 2 * D * Math.tan(toRad(data.field_h_deg / 2)) : null;
    const fieldDiaFt = fieldDiaM != null ? fieldDiaM * 3.28084 : null;
    const fieldAreaM2 = fieldDiaM != null ? Math.PI * (fieldDiaM / 2) ** 2 : null;
    const fieldAreaFt2 = fieldAreaM2 != null ? fieldAreaM2 * 10.7639 : null;
    const irradianceMWm2 = data.peak_irradiance_mWm2 / D ** 2;
    const irradianceUWcm2 = irradianceMWm2 / 10;
    const degradPct = (1 - irradianceMWm2 / data.peak_irradiance_mWm2) * 100;
    return { D, beamDiaM, beamDiaFt, beamAreaM2, beamAreaFt2, fieldDiaM, fieldDiaFt, fieldAreaM2, fieldAreaFt2, irradianceMWm2, irradianceUWcm2, degradPct };
  }, [data, throwDistanceM]);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const sStyles = useMemo(() => createStatStyles(colors), [colors]);

  if (data == null || calc == null) return null;

  const safetyColor =
    calc.irradianceMWm2 > SAFETY_THRESHOLDS.danger ? '#E74C3C'
    : calc.irradianceMWm2 > SAFETY_THRESHOLDS.warning ? '#F97316'
    : calc.irradianceMWm2 > SAFETY_THRESHOLDS.caution ? '#F5A623'
    : '#22C55E';

  const safetyLabel =
    calc.irradianceMWm2 > SAFETY_THRESHOLDS.danger ? 'DANGER'
    : calc.irradianceMWm2 > SAFETY_THRESHOLDS.warning ? 'WARNING'
    : calc.irradianceMWm2 > SAFETY_THRESHOLDS.caution ? 'CAUTION'
    : 'SAFE';

  const MAX_ANGLE = 165;
  const beamPx = Math.round(Math.min(data.beam_h_deg / MAX_ANGLE, 1) * 0.85 * coneMaxWidth);
  const fieldPx = data.field_h_deg != null
    ? Math.round(Math.min(data.field_h_deg / MAX_ANGLE, 1) * 0.85 * coneMaxWidth)
    : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Coverage Preview @ {calc.D}m throw</Text>

      <View style={styles.coneWrap}>
        {fieldPx != null && (
          <View style={[styles.cone, {
            width: fieldPx,
            borderLeftWidth: fieldPx / 2,
            borderRightWidth: fieldPx / 2,
            borderBottomColor: 'rgba(155, 109, 255, 0.1)',
          }]} />
        )}
        <View style={[styles.cone, {
          width: beamPx,
          borderLeftWidth: beamPx / 2,
          borderRightWidth: beamPx / 2,
          borderBottomColor: 'rgba(155, 109, 255, 0.3)',
        }]} />
        <View style={styles.fixturePoint} />
        <Text style={styles.coneLabel}>
          {data.beam_h_deg}° beam{data.field_h_deg != null ? ` / ${data.field_h_deg}° field` : ''}
        </Text>
      </View>

      <View style={styles.grid}>
        <StatBox label="Beam dia" valueM={`${calc.beamDiaM.toFixed(2)}m`} valueFt={`${calc.beamDiaFt.toFixed(2)}ft`} styles={sStyles} />
        <StatBox label="Beam Area" valueM={`${calc.beamAreaM2.toFixed(2)}m²`} valueFt={`${calc.beamAreaFt2.toFixed(1)}ft²`} styles={sStyles} />
        {calc.fieldDiaM != null && calc.fieldDiaFt != null && (
          <StatBox label="Field dia" valueM={`${calc.fieldDiaM.toFixed(2)}m`} valueFt={`${calc.fieldDiaFt.toFixed(2)}ft`} styles={sStyles} />
        )}
      </View>

      <View style={styles.irradRow}>
        <View style={[styles.safetyBadge, { backgroundColor: safetyColor + '18', borderColor: safetyColor + '40' }]}>
          <Text style={[styles.safetyLabel, { color: safetyColor }]}>{safetyLabel}</Text>
        </View>
        <View style={styles.irradValues}>
          <Text style={styles.irradMain}>{calc.irradianceMWm2.toFixed(1)} mW/m²</Text>
          <Text style={styles.irradSub}>{calc.degradPct.toFixed(1)}% reduction vs 1m</Text>
        </View>
      </View>
    </View>
  );
}

function StatBox({ label, valueM, valueFt, styles }: { label: string; valueM: string; valueFt: string; styles: ReturnType<typeof createStatStyles> }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valM}>{valueM}</Text>
      <Text style={styles.valFt}>{valueFt}</Text>
    </View>
  );
}

function createStatStyles(colors: ThemeColors) {
  return StyleSheet.create({
    box: {
      flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 80,
      borderWidth: 1, borderColor: colors.border,
    },
    label: { fontSize: 10, color: colors.textTertiary, marginBottom: 2, fontWeight: '500' as const },
    valM: { fontSize: 13, fontWeight: '700' as const, color: colors.text },
    valFt: { fontSize: 11, color: colors.textSecondary },
  });
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 14, fontWeight: '700' as const, color: colors.text, marginBottom: 14, letterSpacing: -0.1 },
    coneWrap: { height: 80, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 14, position: 'relative' as const },
    cone: {
      position: 'absolute' as const,
      bottom: 0,
      height: 65,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomWidth: 65,
    },
    fixturePoint: {
      position: 'absolute' as const, top: 0, width: 10, height: 10, borderRadius: 5,
      backgroundColor: colors.primary,
    },
    coneLabel: { position: 'absolute' as const, bottom: 2, fontSize: 10, color: colors.textTertiary },
    grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginBottom: 14 },
    irradRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
    safetyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    safetyLabel: { fontSize: 11, fontWeight: '800' as const },
    irradValues: { flex: 1 },
    irradMain: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
    irradSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  });
}
