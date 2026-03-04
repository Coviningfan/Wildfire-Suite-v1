import { Stack } from 'expo-router';

export default function ResourcesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[tutorialId]"
        dangerouslySingular={({ params }) => String(params?.tutorialId ?? 'tutorial')}
      />
    </Stack>
  );
}
