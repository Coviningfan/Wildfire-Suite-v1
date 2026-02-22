import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export function PoweredBy() {
  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <Text style={styles.text}>
        Powered by <Text style={styles.brand}>JABVLabs</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  divider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 14,
  },
  text: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center' as const,
    letterSpacing: 0.3,
  },
  brand: {
    color: theme.colors.primary,
    fontWeight: '700' as const,
  },
});
