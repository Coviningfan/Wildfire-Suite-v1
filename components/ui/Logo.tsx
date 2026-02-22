import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '@/constants/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  imageOnly?: boolean;
}

const sizes = {
  small: { imgH: 24, title: 13, subtitle: 9, tag: 8 },
  medium: { imgH: 32, title: 17, subtitle: 11, tag: 9 },
  large: { imgH: 44, title: 22, subtitle: 13, tag: 10 },
};

export function Logo({ size = 'medium', showTagline = false, imageOnly = false }: LogoProps) {
  const s = sizes[size];

  if (imageOnly) {
    return (
      <Image
        source={require('@/assets/images/wildfire-logo.png')}
        style={{ height: s.imgH, width: s.imgH * 4.5 }}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/wildfire-logo.png')}
        style={{ height: s.imgH, width: s.imgH * 4.5 }}
        resizeMode="contain"
      />
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
  tagline: {
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    marginTop: 8,
  },
});
