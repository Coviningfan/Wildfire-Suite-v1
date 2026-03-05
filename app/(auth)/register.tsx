import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterScreen() {
  const { login } = useAuthStore();

  useEffect(() => {
    login();
  }, [login]);

  return <View style={{ flex: 1, backgroundColor: '#09090B' }} />;
}
