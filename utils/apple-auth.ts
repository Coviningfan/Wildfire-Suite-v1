import { Platform } from 'react-native';

interface AppleAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
}

export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const AppleAuth = await import('expo-apple-authentication');
    return await AppleAuth.default.isAvailableAsync();
  } catch (error) {
    console.log('[AppleAuth] Not available:', error);
    return false;
  }
}

export async function signInWithApple(): Promise<AppleAuthResult> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Apple Sign In is only available on iOS' };
  }
  try {
    const AppleAuth = await import('expo-apple-authentication');
    const credential = await AppleAuth.default.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    });

    const firstName = credential.fullName?.givenName ?? '';
    const lastName = credential.fullName?.familyName ?? '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || 'Apple User';
    const email = credential.email ?? `apple_${credential.user.substring(0, 8)}@icloud.com`;

    console.log('[AppleAuth] Sign in successful:', { name, email, userId: credential.user });

    return {
      success: true,
      user: {
        id: credential.user,
        email,
        name,
      },
    };
  } catch (error: any) {
    if (error?.code === 'ERR_REQUEST_CANCELED') {
      console.log('[AppleAuth] User cancelled');
      return { success: false, error: 'cancelled' };
    }
    console.log('[AppleAuth] Error:', error);
    return { success: false, error: 'Apple Sign In failed. Please try again.' };
  }
}
