import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '@/constants/theme';

const logoSource = require('@/assets/images/wildfire-logo.png');
const logoAsset = Image.resolveAssetSource(logoSource);

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  imageOnly?: boolean;
}

const sizes = {
  small: { imgH: 24, title: 13, subtitle: 9, tag: 8, ratio: 4.5 },
  medium: { imgH: 32, title: 17, subtitle: 11, tag: 9, ratio: 4.5 },
  large: { imgH: 44, title: 22, subtitle: 13, tag: 10, ratio: 4.5 },
};

export function Logo({ size = 'medium', showTagline = false, imageOnly = false }: LogoProps) {
  const s = sizes[size];
  const aspectRatio = logoAsset?.width && logoAsset?.height ? logoAsset.width / logoAsset.height : s.ratio;
  const logoWidth = Math.min(s.imgH * aspectRatio, 180);

  if (imageOnly) {
    return (
      <Image
        source={logoSource}
        style={[styles.logoImage, { height: s.imgH, width: logoWidth }]}
        resizeMode="contain"
        testID="wildfire-logo-image"
      />
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={logoSource}
        style={[styles.logoImage, { height: s.imgH, width: logoWidth }]}
        resizeMode="contain"
        testID="wildfire-logo-image"
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
  logoImage: {
    alignSelf: 'center',
  },
  tagline: {
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    marginTop: 8,
  },
});
