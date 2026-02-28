import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';

interface PickerProps {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}

export function Picker({ label, value, options, onValueChange }: PickerProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const handleSelect = useCallback((option: string) => {
    onValueChange(option);
    setIsVisible(false);
  }, [onValueChange]);

  const renderItem = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.option, item === value && styles.optionSelected]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionText, item === value && styles.optionTextSelected]}>{item || 'All'}</Text>
      {item === value && <Check size={18} color={colors.primary} />}
    </TouchableOpacity>
  ), [value, handleSelect, styles, colors]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>{value || 'Select...'}</Text>
        <ChevronDown size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsVisible(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.handle} />
            </View>
            <Text style={styles.modalTitle}>{label || 'Select'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={renderItem}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

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
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    value: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    placeholder: {
      color: colors.placeholder,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalHeader: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 4,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceElevated,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: colors.text,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
      letterSpacing: -0.2,
    },
    list: {
      maxHeight: 400,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    optionSelected: {
      backgroundColor: colors.glow,
    },
    optionText: {
      fontSize: 15,
      color: colors.text,
    },
    optionTextSelected: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
  });
}
