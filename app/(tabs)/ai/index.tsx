import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Sparkles, User, Zap, Lightbulb, Shield, RotateCcw, Copy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { theme } from '@/constants/theme';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { getFixtureCategory, getFixtureNotes, getFixturePowerWatts, getFixtureControlType } from '@/utils/fixture-helpers';

const SUGGESTIONS = [
  { icon: Zap, label: 'Best fixture for a 5m throw?', color: theme.colors.primary },
  { icon: Lightbulb, label: 'How to light a 10x8m stage?', color: theme.colors.secondary },
  { icon: Shield, label: 'UV safety for a haunted house', color: theme.colors.success },
];

export default function AIAssistantScreen() {
  const [input, setInput] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  const calculator = useRef(new LightingCalculator()).current;

  const { messages, error, sendMessage, setMessages } = useRorkAgent({
    tools: {
      calculateIrradiance: createRorkTool({
        description: 'Calculate UV irradiance for a Wildfire lighting fixture at a given distance. Use this when a user asks about irradiance, throw distance, beam coverage, or wants to run a calculation.',
        zodSchema: z.object({
          fixture: z.string().describe('Fixture model name, e.g. VSP-120F, EM-44L, UB-44'),
          verticalHeight: z.number().describe('Vertical mounting height in metres'),
          horizontalDistance: z.number().describe('Horizontal offset distance in metres'),
          beamWidth: z.number().optional().describe('Target beam width in metres'),
          beamHeight: z.number().optional().describe('Target beam height in metres'),
        }),
        execute(params) {
          console.log('[AI Tool] calculateIrradiance:', params);
          const result = calculator.calculateRadiometricData(
            params.fixture,
            params.verticalHeight,
            params.horizontalDistance,
            params.beamWidth ?? 12,
            params.beamHeight ?? 12,
          );
          return JSON.stringify(result);
        },
      }),
      getFixtureInfo: createRorkTool({
        description: 'Get detailed specifications for a Wildfire UV lighting fixture. Use when user asks about a specific fixture model.',
        zodSchema: z.object({
          fixture: z.string().describe('Fixture model name'),
        }),
        execute(params) {
          console.log('[AI Tool] getFixtureInfo:', params.fixture);
          const data = LightingCalculator.getFixtureData(params.fixture);
          if (!data) return JSON.stringify({ error: 'Fixture not found' });
          return JSON.stringify({
            model: params.fixture,
            beam_h_deg: data.beam_h_deg,
            beam_v_deg: data.beam_v_deg,
            field_h_deg: data.field_h_deg,
            field_v_deg: data.field_v_deg,
            peak_irradiance_mWm2: data.peak_irradiance_mWm2,
            category: getFixtureCategory(params.fixture),
            power_watts: getFixturePowerWatts(params.fixture),
            control: getFixtureControlType(params.fixture),
            notes: getFixtureNotes(params.fixture),
          });
        },
      }),
      listFixtures: createRorkTool({
        description: 'List all available Wildfire UV fixture models with basic specs. Use when user wants to browse or compare fixtures.',
        zodSchema: z.object({}),
        execute() {
          console.log('[AI Tool] listFixtures');
          const models = LightingCalculator.getFixtureModels();
          const list = models.map(m => {
            const d = LightingCalculator.getFixtureData(m);
            return {
              model: m,
              peak_mWm2: d?.peak_irradiance_mWm2,
              beam_deg: d?.beam_h_deg,
              category: getFixtureCategory(m),
              power: getFixturePowerWatts(m),
            };
          });
          return JSON.stringify(list);
        },
      }),
    },
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    sendMessage(text);
  }, [input, sendMessage]);

  const handleSuggestion = useCallback((text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMessage(text);
  }, [sendMessage]);

  const handleCopy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([]);
  }, [setMessages]);

  const isStreaming = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1]?.parts?.some((p: any) => p.type === 'tool' && (p.state === 'input-streaming' || p.state === 'input-available'));

  const renderMessage = useCallback(({ item: m }: { item: any }) => {
    const isUser = m.role === 'user';

    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatarAI}>
            <Sparkles size={14} color={theme.colors.primary} />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAI]}>
          {m.parts?.map((part: any, i: number) => {
            if (part.type === 'text' && part.text) {
              return (
                <View key={`${m.id}-${i}`}>
                  <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{part.text}</Text>
                  {!isUser && (
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => handleCopy(part.text)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Copy size={12} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }
            if (part.type === 'tool') {
              if (part.state === 'output-available') {
                return (
                  <View key={`${m.id}-${i}`} style={styles.toolResult}>
                    <View style={styles.toolHeader}>
                      <Zap size={12} color={theme.colors.secondary} />
                      <Text style={styles.toolName}>{part.toolName}</Text>
                    </View>
                  </View>
                );
              }
              if (part.state === 'input-streaming' || part.state === 'input-available') {
                return (
                  <View key={`${m.id}-${i}`} style={styles.toolRunning}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.toolRunningText}>Running {part.toolName}...</Text>
                  </View>
                );
              }
              if (part.state === 'output-error') {
                return (
                  <View key={`${m.id}-${i}`} style={styles.toolError}>
                    <Text style={styles.toolErrorText}>Tool error: {part.errorText}</Text>
                  </View>
                );
              }
            }
            return null;
          })}
        </View>
        {isUser && (
          <View style={styles.avatarUser}>
            <User size={14} color="#fff" />
          </View>
        )}
      </View>
    );
  }, [handleCopy]);

  const hasMessages = messages.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Sparkles size={18} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Wildfire AI</Text>
            <Text style={styles.headerSub}>UV Lighting Expert</Text>
          </View>
        </View>
        {hasMessages && (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
            <RotateCcw size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {!hasMessages ? (
        <View style={styles.emptyState}>
          <Animated.View style={[styles.emptyIcon, { opacity: pulseAnim }]}>
            <Sparkles size={48} color={theme.colors.primary} />
          </Animated.View>
          <Text style={styles.emptyTitle}>Ask me anything about UV lighting</Text>
          <Text style={styles.emptyDesc}>
            I can calculate irradiance, recommend fixtures, explain safety protocols, and help design your lighting setup.
          </Text>

          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionCard}
                onPress={() => handleSuggestion(s.label)}
                activeOpacity={0.7}
              >
                <View style={[styles.suggestionIcon, { backgroundColor: s.color + '18' }]}>
                  <s.icon size={16} color={s.color} />
                </View>
                <Text style={styles.suggestionText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Connection error. Please try again.</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about UV lighting..."
              placeholderTextColor={theme.colors.placeholder}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, input.trim() ? styles.sendBtnActive : null]}
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
            activeOpacity={0.7}
          >
            {isStreaming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color={input.trim() ? '#fff' : theme.colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center' as const,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  suggestions: {
    width: '100%',
    gap: 10,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  avatarAI: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatarUser: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  msgBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 14,
  },
  msgBubbleUser: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
  },
  msgBubbleAI: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  msgText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  msgTextUser: {
    color: '#fff',
  },
  copyBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    padding: 4,
  },
  toolResult: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolName: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: '600' as const,
  },
  toolRunning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 10,
  },
  toolRunningText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500' as const,
  },
  toolError: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 10,
  },
  toolErrorText: {
    fontSize: 12,
    color: theme.colors.error,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.error,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 120,
    overflow: 'hidden',
  },
  input: {
    fontSize: 15,
    color: theme.colors.text,
    paddingHorizontal: 18,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: theme.colors.primary,
  },
});
