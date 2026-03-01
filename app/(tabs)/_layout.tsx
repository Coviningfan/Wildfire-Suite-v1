import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Calculator, Lightbulb, User, Sparkles, BookOpen } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeColors } from '@/hooks/useTheme';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();
  const colors = useThemeColors();

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/welcome' as any} />;
  }

  return (
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
      {/* History hidden from tab bar — accessible via Calculator header button */}
      <Tabs.Screen name="calculations" options={{ href: null }} />
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
  );
}
