import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { CheckCircle, AlertTriangle, XCircle, Calculator } from 'lucide-react-native';
import { useLightingStore } from '@/stores/lighting-store';
import { Card } from '@/components/ui/Card';
import { theme } from '@/constants/theme';

export function CalculationPreview() {
  const { showingPreview, lastCalculation, getSafetyLevel } = useLightingStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (showingPreview) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [showingPreview, fadeAnim, scaleAnim]);

  if (!showingPreview || !lastCalculation || 'error' in lastCalculation) {
    return null;
  }

  const { irradiance_report } = lastCalculation;
  const safetyLevel = getSafetyLevel(lastCalculation);

  const safetyConfig = {
    safe: { icon: <CheckCircle size={32} color={theme.colors.success} />, color: theme.colors.success, msg: 'Safe UV levels' },
    caution: { icon: <AlertTriangle size={32} color={theme.colors.warning} />, color: theme.colors.warning, msg: 'Moderate UV - Use caution' },
    warning: { icon: <AlertTriangle size={32} color={theme.colors.safetyOrange} />, color: theme.colors.safetyOrange, msg: 'Warning: Use PPE' },
    danger: { icon: <XCircle size={32} color={theme.colors.error} />, color: theme.colors.error, msg: 'High UV - Safety required' },
  };

  const config = safetyConfig[safetyLevel];

  return (
    <Modal visible={showingPreview} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <Card style={styles.previewCard}>
            <View style={styles.header}>
              <View style={styles.calcIcon}>
                <Calculator size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.complete}>Calculation Complete</Text>
            </View>

            <View style={[styles.safetySection, { borderColor: config.color + '40' }]}>
              {config.icon}
              <Text style={[styles.safetyText, { color: config.color }]}>{config.msg}</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Distance</Text>
                <Text style={styles.gridValue}>{irradiance_report.throw_distance_m.toFixed(1)}m</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Irradiance</Text>
                <Text style={styles.gridValue}>{irradiance_report.irradiance_mWm2.toFixed(0)} mW/m²</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Beam Area</Text>
                <Text style={styles.gridValue}>{irradiance_report.beam_area_m2.toFixed(1)}m²</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Degradation</Text>
                <Text style={styles.gridValue}>{irradiance_report.irradiance_degradation_percent.toFixed(1)}%</Text>
              </View>
            </View>

            <Text style={styles.hint}>Auto-dismissing in a few seconds...</Text>
          </Card>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  container: { width: '100%', maxWidth: 380 },
  previewCard: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginHorizontal: 0,
    ...theme.shadows.glow,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  calcIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  complete: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center' as const,
    letterSpacing: -0.2,
  },
  safetySection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
  },
  safetyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surfaceSecondary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridLabel: { fontSize: 11, color: theme.colors.textTertiary, marginBottom: 4, fontWeight: '500' as const },
  gridValue: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text, textAlign: 'center' as const },
  hint: { fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center' as const },
});
