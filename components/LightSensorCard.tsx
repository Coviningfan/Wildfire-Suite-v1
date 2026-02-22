import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Sun, SunDim, Moon, Eye, EyeOff } from 'lucide-react-native';
import { useLightSensor } from '@/hooks/useLightSensor';
import { theme } from '@/constants/theme';

export function LightSensorCard() {
  const { illuminance, isAvailable, isActive, start, stop, getLuxCategory, getLuxRecommendation } = useLightSensor();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive && illuminance !== null) {
      const normalized = Math.min(illuminance / 1000, 1);
      Animated.timing(barAnim, {
        toValue: normalized,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [illuminance, isActive, barAnim]);

  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Sun size={16} color={theme.colors.secondary} />
          </View>
          <Text style={styles.title}>Ambient Light Sensor</Text>
        </View>
        <View style={styles.unavailableBox}>
          <Eye size={18} color={theme.colors.textTertiary} />
          <Text style={styles.unavailableText}>
            {Platform.OS === 'ios'
              ? 'Light sensor data is only available on Android devices.'
              : 'Light sensor is not available on this platform.'}
          </Text>
        </View>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Sun size={16} color={theme.colors.secondary} />
          </View>
          <Text style={styles.title}>Ambient Light Sensor</Text>
        </View>
        <View style={styles.unavailableBox}>
          <EyeOff size={18} color={theme.colors.textTertiary} />
          <Text style={styles.unavailableText}>
            Light sensor not available on this device.
          </Text>
        </View>
      </View>
    );
  }

  const category = getLuxCategory();
  const recommendation = getLuxRecommendation();
  const luxColor = getLuxColor(illuminance);
  const LuxIcon = getLuxIcon(illuminance);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: luxColor + '18' }]}>
          <Sun size={16} color={luxColor} />
        </View>
        <Text style={styles.title}>Ambient Light</Text>
        <TouchableOpacity
          style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
          onPress={isActive ? stop : start}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
            {isActive ? 'Stop' : 'Measure'}
          </Text>
        </TouchableOpacity>
      </View>

      {isActive && illuminance !== null ? (
        <View style={styles.readingSection}>
          <View style={styles.readingRow}>
            <Animated.View style={[styles.luxIconWrap, { transform: [{ scale: pulseAnim }], backgroundColor: luxColor + '18' }]}>
              <LuxIcon size={24} color={luxColor} />
            </Animated.View>
            <View style={styles.readingText}>
              <Text style={[styles.luxValue, { color: luxColor }]}>
                {illuminance.toFixed(0)} <Text style={styles.luxUnit}>lx</Text>
              </Text>
              <Text style={styles.luxCategory}>{category}</Text>
            </View>
          </View>

          <View style={styles.barContainer}>
            <Animated.View
              style={[
                styles.bar,
                {
                  backgroundColor: luxColor,
                  width: barAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['2%', '100%'],
                  }),
                },
              ]}
            />
            <View style={styles.barLabels}>
              <Text style={styles.barLabel}>Dark</Text>
              <Text style={styles.barLabel}>Bright</Text>
            </View>
          </View>

          <View style={styles.recBox}>
            <Text style={styles.recTitle}>UV Recommendation</Text>
            <Text style={styles.recText}>{recommendation}</Text>
          </View>
        </View>
      ) : isActive ? (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>Waiting for sensor data...</Text>
        </View>
      ) : (
        <View style={styles.inactiveBox}>
          <Text style={styles.inactiveText}>
            Tap "Measure" to read ambient light levels. This helps determine if the environment is suitable for UV effects.
          </Text>
        </View>
      )}
    </View>
  );
}

function getLuxColor(lux: number | null): string {
  if (lux === null) return theme.colors.textSecondary;
  if (lux <= 1) return '#6366F1';
  if (lux <= 50) return '#22C55E';
  if (lux <= 200) return '#84CC16';
  if (lux <= 500) return '#EAB308';
  if (lux <= 1000) return '#F97316';
  return '#EF4444';
}

function getLuxIcon(lux: number | null): typeof Sun {
  if (lux === null) return Sun;
  if (lux <= 50) return Moon;
  if (lux <= 500) return SunDim;
  return Sun;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.1,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  toggleBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.glow,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.primary,
  },
  readingSection: {
    gap: 12,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  luxIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readingText: {
    flex: 1,
  },
  luxValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  luxUnit: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  luxCategory: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  barContainer: {
    marginTop: 4,
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  barLabel: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
  },
  recBox: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: theme.colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  recText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  unavailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unavailableText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  inactiveBox: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inactiveText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  waitingBox: {
    padding: 14,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
});
