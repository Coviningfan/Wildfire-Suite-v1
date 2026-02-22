import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { HelpCircle, X } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface Props {
  title: string;
  body: string;
  size?: number;
}

export function InfoTooltip({ title, body, size = 16 }: Props) {
  const [visible, setVisible] = useState<boolean>(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  return (
    <>
      <TouchableOpacity onPress={open} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <HelpCircle size={size} color={theme.colors.textTertiary} />
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.topRow}>
              <View style={styles.iconWrap}>
                <HelpCircle size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={close} style={styles.closeBtn}>
                <X size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll}>
              <Text style={styles.body}>{body}</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: theme.colors.surfaceElevated,
    alignSelf: 'center',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: 220 },
  body: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
