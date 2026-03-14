import * as AppleAuthentication from 'expo-apple-authentication';

export interface AppleSignInResult {
  identityToken: string | null;
  authorizationCode: string | null;
  user: string;
  email: string | null;
  fullName: AppleAuthentication.AppleAuthenticationFullName | null;
}

/**
 * Trigger the Apple Sign-In sheet and return the credential.
 * Returns identityToken (JWT) needed by Supabase signInWithIdToken.
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  return {
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    user: credential.user,
    email: credential.email,
    fullName: credential.fullName,
  };
}
