import React, { useCallback, useRef, useMemo } from 'react';
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
import { useThemeColors } from '@/hooks/useTheme';

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
  const colors = useThemeColors();
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

  const variantStyle = useMemo((): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'secondary':
        return { backgroundColor: colors.surfaceElevated, borderColor: colors.border };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.border };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        };
      default:
        return {};
    }
  }, [variant, colors]);

  const textVariantColor = useMemo((): string => {
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return colors.text;
      case 'outline': return colors.text;
      case 'danger': return '#FFFFFF';
      case 'success': return '#FFFFFF';
      default: return colors.text;
    }
  }, [variant, colors]);

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
          <ActivityIndicator size="small" color={variant === 'outline' ? colors.text : '#FFFFFF'} />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[styles.text, { color: textVariantColor }, textSizeStyle, isDisabled && { color: colors.textTertiary }, textStyle]} numberOfLines={1}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

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
});
