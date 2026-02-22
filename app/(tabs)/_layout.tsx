import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Calculator, History, Lightbulb, User } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { theme } from '@/constants/theme';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/welcome' as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 0.5,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 12,
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          letterSpacing: 0.2,
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
          tabBarIcon: ({ color, size }) => <Calculator size={size - 2} color={color} strokeWidth={color === theme.colors.primary ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="calculations"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <History size={size - 2} color={color} strokeWidth={color === theme.colors.primary ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="fixtures"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ color, size }) => <Lightbulb size={size - 2} color={color} strokeWidth={color === theme.colors.primary ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} strokeWidth={color === theme.colors.primary ? 2.5 : 1.8} />,
        }}
      />
    </Tabs>
  );
}
