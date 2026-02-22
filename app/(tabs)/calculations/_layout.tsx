import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';

export default function CalculationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
