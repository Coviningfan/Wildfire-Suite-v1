import React, { useState, useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Calculator, Lightbulb, User, Sparkles, BookOpen, Box } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeColors } from '@/hooks/useTheme';
import { Platform, View } from 'react-native';
import { useShouldShowAppTour } from '@/hooks/useFirstLaunch';
import { OnboardingModal } from '@/components/ui/OnboardingModal';

export default function TabLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const colors = useThemeColors();

  const isDemo = user?.email === 'demo@example.com';
  const [shouldShowTour, markTourSeen] = useShouldShowAppTour(user?.id, isDemo);
  const [tourVisible, setTourVisible] = useState(false);
  const tourTriggered = React.useRef(false);

  useEffect(() => {
    if (isAuthenticated && shouldShowTour && !tourTriggered.current) {
      tourTriggered.current = true;
      const timer = setTimeout(() => {
        setTourVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, shouldShowTour]);

  const handleDismissTour = () => {
    setTourVisible(false);
    markTourSeen();
  };

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/welcome' as any} />;
  }

  return (
    <>
    <OnboardingModal visible={tourVisible} onDismiss={handleDismissTour} />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            },
            android: {
              elevation: 16,
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Calculator',
          tabBarIcon: ({ color, size }) => <Calculator size={size - 2} color={color} strokeWidth={color === colors.primary ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="fixtures"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ color, size }) => <Lightbulb size={size - 2} color={color} strokeWidth={color === colors.primary ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="simulate"
        options={{
          title: 'Simulate',
          tabBarIcon: ({ color, size }) => <Box size={size - 2} color={color} strokeWidth={color === colors.primary ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6 } : undefined}>
              <Sparkles size={size - 2} color={color} strokeWidth={color === colors.primary ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calculations"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 2} color={color} strokeWidth={color === colors.primary ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} strokeWidth={color === colors.primary ? 2.5 : 1.8} />,
        }}
      />
    </Tabs>
    </>
  );
}
