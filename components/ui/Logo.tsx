import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

const sizes = {
  small: { icon: 18, title: 13, subtitle: 9, tag: 8, wrap: 32 },
  medium: { icon: 24, title: 17, subtitle: 11, tag: 9, wrap: 42 },
  large: { icon: 32, title: 22, subtitle: 13, tag: 10, wrap: 54 },
};

export function Logo({ size = 'medium', showTagline = false }: LogoProps) {
  const s = sizes[size];

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={[styles.iconWrap, { width: s.wrap, height: s.wrap, borderRadius: s.wrap * 0.3 }]}>
          <Flame size={s.icon} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: s.title }]}>WILDFIRE</Text>
          <Text style={[styles.subText, { fontSize: s.subtitle }]}>LIGHTING</Text>
        </View>
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: s.tag }]}>IGNITE YOUR IMAGINATION</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.12)',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  brandText: {
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: 2.5,
  },
  subText: {
    fontWeight: '500' as const,
    color: theme.colors.textTertiary,
    letterSpacing: 4,
    marginTop: -1,
  },
  tagline: {
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    marginTop: 8,
  },
});
