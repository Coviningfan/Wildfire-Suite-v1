import { Platform } from 'react-native';

interface BiometricResult {
  success: boolean;
  error?: string;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const LocalAuth = await import('expo-local-authentication');
    const compatible = await LocalAuth.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuth.isEnrolledAsync();
    console.log('[BiometricAuth] Hardware:', compatible, 'Enrolled:', enrolled);
    return enrolled;
  } catch (error) {
    console.log('[BiometricAuth] Check failed:', error);
    return false;
  }
}

export async function getBiometricType(): Promise<string> {
  if (Platform.OS === 'web') return 'none';
  try {
    const LocalAuth = await import('expo-local-authentication');
    const types = await LocalAuth.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(LocalAuth.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(LocalAuth.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  } catch {
    return 'Biometric';
  }
}

export async function authenticateWithBiometric(promptMessage?: string): Promise<BiometricResult> {
  if (Platform.OS === 'web') {
    return { success: false, error: 'Biometric auth not available on web' };
  }
  try {
    const LocalAuth = await import('expo-local-authentication');
    const result = await LocalAuth.authenticateAsync({
      promptMessage: promptMessage ?? 'Authenticate to sign in',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });

    console.log('[BiometricAuth] Result:', result);

    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error ?? 'Authentication failed' };
  } catch (error) {
    console.log('[BiometricAuth] Error:', error);
    return { success: false, error: 'Biometric authentication failed' };
  }
}
