import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function CalculationsLayout() {
  return (
    <ErrorBoundary fallback="The calculations section encountered an error. Tap Try Again to recover.">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </ErrorBoundary>
  );
}
