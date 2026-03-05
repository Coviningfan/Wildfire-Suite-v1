import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Camera, Flashlight, FlashlightOff } from 'lucide-react-native';
import { useLightingStore } from '@/stores/lighting-store';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';

export function QRScanner() {
  const { isQRScannerOpen, closeQRScanner, handleQRScan } = useLightingStore();
  const [torch, setTorch] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }
    };
  }, []);

  const onBarcodeScanned = useCallback((result: { data: string }) => {
    if (hasScanned) return;
    setHasScanned(true);
    console.log('[QRScanner] Scanned:', result.data);
    handleQRScan(result.data);
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }
    scanTimerRef.current = setTimeout(() => {
      setHasScanned(false);
      scanTimerRef.current = null;
    }, 2000);
  }, [hasScanned, handleQRScan]);

  const handleClose = useCallback(() => {
    setHasScanned(false);
    setTorch(false);
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    closeQRScanner();
  }, [closeQRScanner]);

  if (!isQRScannerOpen) return null;

  const headerStyle = [
    styles.header,
    {
      paddingTop: insets.top + 16,
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
  ];

  if (Platform.OS === 'web') {
    return (
      <Modal visible={isQRScannerOpen} animationType="slide">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={headerStyle}>
            <Text style={[styles.title, { color: colors.text }]}>Scan Fixture QR Code</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Camera size={64} color={colors.textSecondary} />
            <Text style={[styles.bodyTitle, { color: colors.text }]}>QR Scanner Not Available on Web</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Please select your fixture manually from the dropdown or use the Fixtures tab to browse.
            </Text>
            <View style={styles.actions}>
              <Button title="Close" onPress={handleClose} variant="outline" size="large" />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isQRScannerOpen} animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={headerStyle}>
          <Text style={[styles.title, { color: colors.text }]}>Scan Fixture QR / Barcode</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setTorch(!torch)} style={[styles.torchButton, { backgroundColor: colors.surfaceSecondary }]}>
              {torch ? (
                <FlashlightOff size={20} color={colors.secondary} />
              ) : (
                <Flashlight size={20} color={colors.text} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <NativeCameraScanner
          torch={torch}
          onBarcodeScanned={onBarcodeScanned}
          onClose={handleClose}
          colors={colors}
        />
      </View>
    </Modal>
  );
}

function NativeCameraScanner({
  torch,
  onBarcodeScanned,
  onClose,
  colors,
}: {
  torch: boolean;
  onBarcodeScanned: (result: { data: string }) => void;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);

  const checkPermission = React.useCallback(async () => {
    try {
      const cam = await import('expo-camera');
      const getCameraPermissionsAsync = cam.Camera.getCameraPermissionsAsync;
      const requestCameraPermissionsAsync = cam.Camera.requestCameraPermissionsAsync;
      const status = await getCameraPermissionsAsync();
      if (status.granted) {
        setHasPermission(true);
      } else if (!permissionRequested) {
        setPermissionRequested(true);
        const result = await requestCameraPermissionsAsync();
        setHasPermission(result.granted);
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.log('[QRScanner] Permission error:', error);
      setHasPermission(false);
    }
  }, [permissionRequested]);

  React.useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  if (hasPermission === null) {
    return (
      <View style={styles.body}>
        <Text style={[styles.bodyTitle, { color: colors.text }]}>Requesting Camera Permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.body}>
        <Camera size={64} color={colors.textSecondary} />
        <Text style={[styles.bodyTitle, { color: colors.text }]}>Camera Permission Required</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Please enable camera access in your device settings to scan fixture barcodes.
        </Text>
        <View style={styles.actions}>
          <Button title="Close" onPress={onClose} variant="outline" size="large" />
        </View>
      </View>
    );
  }

  return <CameraPreview torch={torch} onBarcodeScanned={onBarcodeScanned} colors={colors} />;
}

function CameraPreview({
  torch,
  onBarcodeScanned,
  colors,
}: {
  torch: boolean;
  onBarcodeScanned: (result: { data: string }) => void;
  colors: ThemeColors;
}) {
  const [CameraViewComponent, setCameraViewComponent] = useState<React.ComponentType<any> | null>(null);

  React.useEffect(() => {
    import('expo-camera').then((cam) => {
      setCameraViewComponent(() => cam.CameraView);
    }).catch(() => {
      setCameraViewComponent(null);
    });
  }, []);

  if (!CameraViewComponent) {
    return (
      <View style={styles.body}>
        <Text style={[styles.bodyTitle, { color: colors.text }]}>Camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraViewComponent
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'datamatrix'],
        }}
        onBarcodeScanned={onBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />
        </View>
        <Text style={styles.scanHint}>
          Point camera at fixture QR code or barcode
        </Text>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  torchButton: {
    padding: 8,
    borderRadius: 10,
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
    textAlign: 'center' as const,
    marginTop: 24,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    textAlign: 'center' as const,
    marginBottom: 32,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 4,
  },
  scanHint: {
    marginTop: 32,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center' as const,
    fontWeight: '600' as const,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
