import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { Save, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';

interface SaveCalculationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string, projectId?: string) => void;
}

export function SaveCalculationModal({ visible, onClose, onSave }: SaveCalculationModalProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSave = useCallback(() => {
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined, projectId.trim() || undefined);
      setName('');
      setProjectId('');
      setDescription('');
    }
  }, [name, description, projectId, onSave]);

  const handleClose = useCallback(() => {
    setName('');
    setProjectId('');
    setDescription('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <Save size={18} color={colors.primary} />
              </View>
              <Text style={styles.title}>Save Calculation</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Input
              label="Calculation Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Main Stage UV Setup"
            />
            <Input
              label="Project ID (Optional)"
              value={projectId}
              onChangeText={setProjectId}
              placeholder="e.g., PROJ-2024-001"
            />
            <Text style={styles.descLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes..."
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.buttons}>
            <Button title="Cancel" onPress={handleClose} variant="outline" size="medium" />
            <Button title="Save" onPress={handleSave} variant="primary" size="medium" disabled={!name.trim()} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '85%',
    },
    handleRow: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 4,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.surfaceElevated,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconWrap: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.glow,
      justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 18, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.2 },
    closeBtn: { padding: 4 },
    content: { padding: 20 },
    descLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 7,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    descInput: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      textAlignVertical: 'top' as const,
      minHeight: 80,
    },
    buttons: {
      flexDirection: 'row',
      gap: 10,
      padding: 20,
      paddingTop: 4,
      paddingBottom: 36,
    },
  });
}
