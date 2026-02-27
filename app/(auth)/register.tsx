import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/stores/auth-store';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function RegisterScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const { register, isLoading } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const canSubmit = name.length > 0 && email.length > 0 && password.length > 0 && confirmPassword.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.bgAccent} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Logo size="small" imageOnly />
            <View style={styles.backBtn} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.formArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join to start calculating</Text>

              <View style={styles.formFields}>
                <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" />
                <Input label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
                <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" secureTextEntry showPasswordToggle />
                <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry />
              </View>

              <TouchableOpacity
                style={[styles.createBtn, !canSubmit && styles.createBtnDisabled]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={isLoading || !canSubmit}
              >
                <Text style={styles.createBtnText}>{isLoading ? 'Creating...' : 'Create Account'}</Text>
              </TouchableOpacity>

              <View style={styles.linkRow}>
                <Text style={styles.linkText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0D',
  },
  bgAccent: {
    position: 'absolute',
    top: -30,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 166, 35, 0.03)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  formArea: {},
  title: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: '#F4F4F5',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: '#71717A',
    marginTop: 6,
    marginBottom: 32,
  },
  formFields: {
    marginBottom: 8,
  },
  createBtn: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#E8412A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E8412A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  createBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.1,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  linkText: {
    fontSize: 14,
    color: '#71717A',
  },
  link: {
    fontSize: 14,
    color: '#E8412A',
    fontWeight: '600' as const,
  },
});
