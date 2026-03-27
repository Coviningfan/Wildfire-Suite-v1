import React from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ResourcesLayout() {
  return (
    <ErrorBoundary fallback="The resources section encountered an error. Tap Try Again to recover.">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="[tutorialId]"
          dangerouslySingular={({ params }) => String(params?.tutorialId ?? 'tutorial')}
        />
      </Stack>
    </ErrorBoundary>
  );
}
