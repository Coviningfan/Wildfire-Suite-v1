import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { Card } from '@/components/ui/Card';
import { PoweredBy } from '@/components/ui/PoweredBy';
import { useAuthStore } from '@/stores/auth-store';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = useCallback(async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      const success = await register(name, email, password);
      if (success) {
        router.replace('/(tabs)/(home)' as any);
      } else {
        Alert.alert('Error', 'Registration failed. Email may already be in use.');
      }
    } catch {
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  }, [name, email, password, confirmPassword, register]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Create Account',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Logo size="medium" />
            <View style={styles.titleContainer}>
              <View style={styles.iconCircle}>
                <UserPlus size={22} color={theme.colors.secondary} />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join to start calculating lighting data</Text>
            </View>
          </View>

          <Card style={styles.card}>
            <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your full name" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry showPasswordToggle />
            <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm your password" secureTextEntry />
            <View style={styles.buttonSection}>
              <Button title="Create Account" onPress={handleRegister} loading={isLoading} variant="primary" size="large" />
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Text style={styles.link} onPress={() => router.push('/(auth)/login' as any)}>Sign in</Text>
            </View>
          </Card>

          <PoweredBy />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  header: { alignItems: 'center', paddingTop: 12, marginBottom: 16 },
  titleContainer: { alignItems: 'center', marginTop: 20 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.1)',
  },
  title: { fontSize: 22, fontWeight: '700' as const, color: theme.colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  card: { marginHorizontal: 0 },
  buttonSection: { marginTop: 4 },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  linkText: { fontSize: 14, color: theme.colors.textSecondary },
  link: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' as const },
});
