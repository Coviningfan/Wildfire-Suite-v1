import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { X, Camera } from 'lucide-react-native';
import { useLightingStore } from '@/stores/lighting-store';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';

export function QRScanner() {
  const { isQRScannerOpen, closeQRScanner } = useLightingStore();

  if (!isQRScannerOpen) return null;

  return (
    <Modal visible={isQRScannerOpen} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Fixture QR Code</Text>
          <TouchableOpacity onPress={closeQRScanner} style={styles.closeButton}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Camera size={64} color={theme.colors.textSecondary} />
          <Text style={styles.bodyTitle}>
            {Platform.OS === 'web' ? 'QR Scanner Not Available on Web' : 'Camera Preview'}
          </Text>
          <Text style={styles.bodyText}>
            {Platform.OS === 'web'
              ? 'Please select your fixture manually from the dropdown.'
              : 'Point your camera at the QR code on the lighting fixture.'}
          </Text>
          <View style={styles.actions}>
            <Button title="Close" onPress={closeQRScanner} variant="outline" size="large" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  bodyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center' as const,
    marginTop: 24,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 32,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
  },
});
