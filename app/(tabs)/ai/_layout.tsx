import React from 'react';
import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AILayout() {
  return (
    <ErrorBoundary fallback="The AI assistant encountered an error. Tap Try Again to recover.">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </ErrorBoundary>
  );
}
