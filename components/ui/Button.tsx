import React, { useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const variantStyle = variantStyles[variant];
  const textVariantStyle = textVariantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const textSizeStyle = textSizeStyles[size];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: size === 'large' ? undefined : 1 }}>
      <TouchableOpacity
        style={[
          styles.button,
          variantStyle,
          sizeStyle,
          isDisabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.85}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'outline' ? theme.colors.text : '#FFFFFF'} />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[styles.text, textVariantStyle, textSizeStyle, isDisabled && styles.disabledText, textStyle]} numberOfLines={1}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const variantStyles: Record<string, ViewStyle> = {
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
  outline: { backgroundColor: 'transparent', borderColor: theme.colors.border },
  danger: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  success: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

const textVariantStyles: Record<string, TextStyle> = {
  primary: { color: '#FFFFFF' },
  secondary: { color: theme.colors.text },
  outline: { color: theme.colors.text },
  danger: { color: '#FFFFFF' },
  success: { color: '#FFFFFF' },
};

const sizeStyles: Record<string, ViewStyle> = {
  small: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 },
  medium: { paddingHorizontal: 20, paddingVertical: 14, minHeight: 50 },
  large: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 54 },
};

const textSizeStyles: Record<string, TextStyle> = {
  small: { fontSize: 13 },
  medium: { fontSize: 15 },
  large: { fontSize: 16, fontWeight: '700' as const },
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.2,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  disabled: { opacity: 0.45 },
  disabledText: { color: theme.colors.textTertiary },
});
