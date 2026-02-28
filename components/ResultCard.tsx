import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';

interface ResultCardProps {
  title: string;
  data: Record<string, number | string>;
}

export function ResultCard({ title, data }: ResultCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Mwm2/g, 'mW/m²')
      .replace(/Uwcm2/g, 'uW/cm²')
      .replace(/Wm2/g, 'W/m²')
      .replace(/Mwcm2/g, 'mW/cm²')
      .replace(/M2/g, 'm²')
      .replace(/Ft2/g, 'ft²')
      .replace(/M3/g, 'm³')
      .replace(/Deg/g, '°');
  };

  const entries = Object.entries(data);

  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.divider} />
      {entries.map(([key, value], index) => (
        <View key={key} style={[styles.row, index === entries.length - 1 && styles.rowLast]}>
          <Text style={styles.label}>{formatLabel(key)}</Text>
          <Text style={styles.value}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </Text>
        </View>
      ))}
    </Card>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    title: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 12,
      letterSpacing: -0.1,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    label: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    value: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600' as const,
      textAlign: 'right' as const,
      flex: 1,
    },
  });
}
