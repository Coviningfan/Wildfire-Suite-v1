import React, { forwardRef, useCallback, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  unit?: string;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  showPasswordToggle?: boolean;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
  error,
  disabled = false,
  required = false,
  unit,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  onFocus,
  onBlur,
  onSubmitEditing,
  style,
  inputStyle,
  showPasswordToggle = false,
  testID,
}, ref) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  }, [onFocus, borderAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.();
  }, [onBlur, borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      ) : null}

      <Animated.View style={[
        styles.inputContainer,
        { borderColor: error ? colors.error : borderColor },
        isFocused && styles.inputFocused,
        disabled ? styles.inputDisabled : null,
      ]}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            unit ? styles.inputWithUnit : null,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="done"
          blurOnSubmit={!multiline}
          testID={testID}
        />

        {unit ? (
          <View style={styles.unitContainer}>
            <Text style={styles.unit}>{unit}</Text>
          </View>
        ) : null}

        {showPasswordToggle && secureTextEntry ? (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

Input.displayName = 'Input';

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: 14,
    },
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 7,
      letterSpacing: 0.2,
    },
    required: {
      color: colors.error,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: Platform.select({ ios: 48, android: 48, default: 48 }),
    },
    inputFocused: {
      backgroundColor: colors.surface,
    },
    inputDisabled: {
      backgroundColor: colors.surfaceElevated,
      opacity: 0.5,
    },
    input: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    inputMultiline: {
      minHeight: 80,
      paddingTop: 12,
      textAlignVertical: 'top' as const,
    },
    inputWithUnit: {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    unitContainer: {
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      justifyContent: 'center',
      minHeight: 48,
    },
    unit: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.textTertiary,
    },
    passwordToggle: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 44,
      minHeight: 44,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
      fontWeight: '500' as const,
    },
  });
}
