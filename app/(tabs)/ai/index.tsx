import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Sparkles, User, Zap, Lightbulb, Shield, RotateCcw, Copy, MessageCircle, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { getFixtureCategory, getFixtureNotes, getFixturePowerWatts, getFixtureControlType } from '@/utils/fixture-helpers';
import { useLightingStore } from '@/stores/lighting-store';

const TypingIndicator = React.memo(({ colors }: { colors: ThemeColors }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    const a1 = createDotAnim(dot1, 0);
    const a2 = createDotAnim(dot2, 200);
    const a3 = createDotAnim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16, paddingHorizontal: 4 }}>
      <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.glow, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
        <Sparkles size={12} color={colors.primary} />
      </View>
      <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.surface, borderRadius: 16, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: colors.border }}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.textTertiary },
              { transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }], opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ]}
          />
        ))}
      </View>
    </View>
  );
});

const AnimatedMessage = React.memo(({ children }: { children: React.ReactNode }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, delay: 40, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
});

export default function AIAssistantScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [input, setInput] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.8)).current;

  const calculator = useRef(new LightingCalculator()).current;
  const { selectedFixture, lastCalculation, verticalHeight, horizontalDistance, beamWidth, beamHeight } = useLightingStore();

  const calcContext = useMemo(() => {
    if (!selectedFixture && !lastCalculation) return '';
    let ctx = '\n\nCurrent calculator state:';
    if (selectedFixture) ctx += `\nSelected fixture: ${selectedFixture}`;
    if (verticalHeight) ctx += `\nVertical height: ${verticalHeight}m`;
    if (horizontalDistance) ctx += `\nHorizontal distance: ${horizontalDistance}m`;
    if (beamWidth) ctx += `\nBeam width: ${beamWidth}m`;
    if (beamHeight) ctx += `\nBeam height: ${beamHeight}m`;
    if (lastCalculation && !('error' in lastCalculation)) {
      const r = lastCalculation.irradiance_report;
      ctx += `\nLast calculation result: throw=${r.throw_distance_m.toFixed(2)}m, irradiance=${r.irradiance_mWm2.toFixed(0)} mW/m², beam area=${r.beam_area_m2.toFixed(2)} m², degradation=${r.irradiance_degradation_percent.toFixed(1)}%`;
    }
    return ctx;
  }, [selectedFixture, lastCalculation, verticalHeight, horizontalDistance, beamWidth, beamHeight]);

  const suggestions = useMemo(() => [
    { icon: Zap, label: 'Best fixture for a 5m throw?', color: colors.primary, tag: 'Fixture' },
    { icon: Lightbulb, label: 'How to light a 10x8m stage?', color: colors.secondary, tag: 'Design' },
    { icon: Shield, label: 'UV safety for a haunted house', color: colors.success, tag: 'Safety' },
  ], [colors]);

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
      Animated.timing(orbitAnim, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [orbitAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowPulse]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    const contextPrefix = calcContext ? `[Context: ${calcContext}]\n\n` : '';
    sendMessage(messages.length === 0 ? `${contextPrefix}${text}` : text);
  }, [input, sendMessage, calcContext, messages.length]);

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

  const isThinking = useMemo(() => {
    if (messages.length === 0) return false;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role !== 'assistant') return false;
    const hasPendingTool = lastMsg?.parts?.some((p: any) => p.type === 'tool' && (p.state === 'input-streaming' || p.state === 'input-available'));
    const hasNoText = !lastMsg?.parts?.some((p: any) => p.type === 'text' && p.text?.trim());
    return hasPendingTool && hasNoText;
  }, [messages]);

  const renderMessage = useCallback(({ item: m }: { item: any; index: number }) => {
    const isUser = m.role === 'user';

    return (
      <AnimatedMessage>
        <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
          {!isUser && (
            <View style={styles.avatarAI}>
              <Sparkles size={13} color={colors.primary} />
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
                        <Copy size={11} color={colors.textTertiary} />
                        <Text style={styles.copyLabel}>Copy</Text>
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
                        <View style={styles.toolIconWrap}>
                          <Zap size={10} color={colors.secondary} />
                        </View>
                        <Text style={styles.toolName}>{part.toolName}</Text>
                        <View style={styles.toolDoneBadge}>
                          <Text style={styles.toolDoneText}>Done</Text>
                        </View>
                      </View>
                    </View>
                  );
                }
                if (part.state === 'input-streaming' || part.state === 'input-available') {
                  return (
                    <View key={`${m.id}-${i}`} style={styles.toolRunning}>
                      <ActivityIndicator size="small" color={colors.primary} />
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
              <User size={13} color="#fff" />
            </View>
          )}
        </View>
      </AnimatedMessage>
    );
  }, [handleCopy, styles, colors]);

  const hasMessages = messages.length > 0;

  const orbitRotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Sparkles size={17} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Wildfire AI</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerSub}>Online</Text>
            </View>
          </View>
        </View>
        {hasMessages && (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
            <RotateCcw size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!hasMessages ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Animated.View style={[styles.orbitRing, { transform: [{ rotate: orbitRotate }] }]}>
                <View style={styles.orbitDot} />
              </Animated.View>
              <Animated.View style={[styles.emptyIcon, { opacity: glowPulse }]}>
                <Sparkles size={36} color={colors.primary} />
              </Animated.View>
            </View>
            <Text style={styles.emptyTitle}>UV Lighting Expert</Text>
            <Text style={styles.emptyDesc}>
              Calculate irradiance, compare fixtures, design setups, and get safety guidance — all powered by AI.
            </Text>

            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionCard}
                  onPress={() => handleSuggestion(s.label)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.suggestionIcon, { backgroundColor: s.color + '14' }]}>
                    <s.icon size={16} color={s.color} />
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionTag}>{s.tag}</Text>
                    <Text style={styles.suggestionText}>{s.label}</Text>
                  </View>
                  <ArrowRight size={14} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.emptyFooter}>
              <MessageCircle size={13} color={colors.textTertiary} />
              <Text style={styles.emptyFooterText}>Ask anything about Wildfire UV lighting</Text>
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
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={isThinking ? <TypingIndicator colors={colors} /> : null}
          />
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Connection error. Please try again.</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about UV lighting..."
              placeholderTextColor={colors.placeholder}
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
              <Send size={17} color={input.trim() ? '#fff' : colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    kavContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
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
      backgroundColor: colors.glow,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.3,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 1,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    headerSub: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '500' as const,
    },
    resetBtn: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingBottom: 40,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    orbitRing: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    orbitDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: -4,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: colors.glow,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '800' as const,
      color: colors.text,
      textAlign: 'center' as const,
      letterSpacing: -0.4,
      marginBottom: 10,
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 22,
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    suggestions: {
      width: '100%',
      gap: 8,
    },
    suggestionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    suggestionContent: {
      flex: 1,
    },
    suggestionTag: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: colors.textTertiary,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      marginBottom: 2,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500' as const,
    },
    emptyFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 28,
      opacity: 0.5,
    },
    emptyFooterText: {
      fontSize: 12,
      color: colors.textTertiary,
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
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: colors.glow,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
    },
    avatarUser: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: colors.primary,
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
      backgroundColor: colors.primary,
      borderBottomRightRadius: 6,
    },
    msgBubbleAI: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    msgText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    msgTextUser: {
      color: '#fff',
    },
    copyBtn: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: colors.surfaceSecondary,
    },
    copyLabel: {
      fontSize: 10,
      color: colors.textTertiary,
      fontWeight: '600' as const,
    },
    toolResult: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      padding: 10,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toolHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    toolIconWrap: {
      width: 20,
      height: 20,
      borderRadius: 5,
      backgroundColor: 'rgba(245, 166, 35, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toolName: {
      fontSize: 12,
      color: colors.secondary,
      fontWeight: '600' as const,
      flex: 1,
    },
    toolDoneBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
    },
    toolDoneText: {
      fontSize: 9,
      fontWeight: '700' as const,
      color: colors.success,
      letterSpacing: 0.3,
    },
    toolRunning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      padding: 10,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
    },
    toolRunningText: {
      fontSize: 13,
      color: colors.textSecondary,
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
      color: colors.error,
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
      color: colors.error,
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
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    inputWrap: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 120,
      overflow: 'hidden',
    },
    input: {
      fontSize: 15,
      color: colors.text,
      paddingHorizontal: 18,
      paddingVertical: Platform.select({ ios: 12, default: 10 }),
      maxHeight: 120,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnActive: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
  });
}
