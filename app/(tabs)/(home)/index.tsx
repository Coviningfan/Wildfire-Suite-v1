import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Calculator, QrCode, HelpCircle, Sparkles, ChevronDown, RotateCcw, Save, Flame, Target, MapPin, Move, Palette, Wand2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLightingStore } from '@/stores/lighting-store';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OnboardingModal } from '@/components/ui/OnboardingModal';
import { CalculationPreview } from '@/components/CalculationPreview';
import { QRScanner } from '@/components/QRScanner';
import { SaveCalculationModal } from '@/components/SaveCalculationModal';
import { LightSensorCard } from '@/components/LightSensorCard';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { generateText } from '@rork-ai/toolkit-sdk';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FLAME_STEPS = [
  {
    letter: 'F',
    title: 'Fixture',
    icon: Target,
    color: theme.colors.primary,
    desc: 'Select your UV light source. Power output, beam angle, and control type vary by model.',
  },
  {
    letter: 'L',
    title: 'Location',
    icon: MapPin,
    color: theme.colors.secondary,
    desc: 'Mounting height + horizontal offset determine throw distance via Pythagorean theorem.',
  },
  {
    letter: 'A',
    title: 'Angle',
    icon: Move,
    color: theme.colors.accent,
    desc: 'Target coverage dimensions. Verifies beam angle covers your desired area at throw distance.',
  },
  {
    letter: 'M',
    title: 'Material',
    icon: Palette,
    color: theme.colors.success,
    desc: 'Surface being lit — paint, fabric, ink each respond differently to UV wavelengths.',
  },
  {
    letter: 'E',
    title: 'Effect',
    icon: Wand2,
    color: '#3B82F6',
    desc: 'Desired visual outcome. Helps optimize fixture selection, intensity, and placement.',
  },
] as const;

const MATERIAL_OPTIONS = [
  'Fluorescent Paint',
  'UV Reactive Fabric',
  'UV Tape / Gaff',
  'Body Paint / Makeup',
  'Paper / Poster',
  'Scenic Elements',
  'Invisible Ink / Security',
  'General / Mixed',
];

const EFFECT_OPTIONS = [
  'Full Wash',
  'Accent / Spot',
  'Reveal / Transition',
  'Ambient Glow',
  'Blacklight Party',
  'Theatrical Scene',
  'Safety Marking',
  'General',
];

type FlameLetter = 'F' | 'L' | 'A' | 'M' | 'E';

export default function CalculatorScreen() {
  const {
    selectedFixture, verticalHeight, horizontalDistance,
    beamWidth, beamHeight, rectHeight, rectWidth, rectDepth,
    isCalculating, lastCalculation,
    setSelectedFixture, setVerticalHeight, setHorizontalDistance,
    setBeamWidth, setBeamHeight, setRectHeight, setRectWidth, setRectDepth,
    calculate, resetInputs, openQRScanner, saveCalculation, getSafetyLevel,
  } = useLightingStore();

  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isFirstLaunch, markSeen] = useFirstLaunch();
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const [material, setMaterial] = useState<string>('');
  const [effect, setEffect] = useState<string>('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const insightAnim = useRef(new Animated.Value(0)).current;
  const calcBtnScale = useRef(new Animated.Value(1)).current;

  const fixtureModels = LightingCalculator.getFixtureModels();

  const flameProgress = useMemo<Record<FlameLetter, boolean>>(() => ({
    F: !!selectedFixture,
    L: !!verticalHeight || !!horizontalDistance,
    A: !!beamWidth || !!beamHeight,
    M: !!material,
    E: !!effect,
  }), [selectedFixture, verticalHeight, horizontalDistance, beamWidth, beamHeight, material, effect]);

  const filledCount = useMemo(() =>
    Object.values(flameProgress).filter(Boolean).length, [flameProgress]);

  const progressWidth = useMemo(() => (filledCount / 5) * 100, [filledCount]);

  const handleCalculate = useCallback(async () => {
    if (!selectedFixture) {
      Alert.alert('Select a Fixture', 'Please choose a fixture model before calculating.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(calcBtnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(calcBtnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    await calculate();
  }, [selectedFixture, calculate, calcBtnScale]);

  const handleSaveCalculation = useCallback((name: string, description?: string, projectId?: string) => {
    const didSave = saveCalculation(name, description, projectId);
    if (didSave) {
      setShowSaveModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Calculation saved to your history.');
    } else {
      Alert.alert('Unable to Save', 'Run a calculation first, then try saving again.');
    }
  }, [saveCalculation]);

  const handleAIInsight = useCallback(async () => {
    if (!lastCalculation || 'error' in lastCalculation) return;
    setAiLoading(true);
    setAiInsight(null);
    try {
      const report = lastCalculation.irradiance_report;
      const safety = getSafetyLevel(lastCalculation);
      const materialCtx = material ? `\nMaterial: ${material}` : '';
      const effectCtx = effect ? `\nDesired Effect: ${effect}` : '';
      const prompt = `You are a UV lighting expert for Wildfire Lighting. Analyze this calculation result in 2-3 concise sentences. Be practical and specific.

Fixture: ${report.fixture_model}
Throw distance: ${report.throw_distance_m.toFixed(2)}m
Irradiance: ${report.irradiance_mWm2.toFixed(2)} mW/m²
Beam area: ${report.beam_area_m2.toFixed(2)} m²
Safety level: ${safety}
Degradation: ${report.irradiance_degradation_percent.toFixed(1)}%${materialCtx}${effectCtx}

Give a quick practical insight about this setup - is the throw distance optimal, is there too much/little power, what could be improved?`;

      const result = await generateText(prompt);
      setAiInsight(result);
      Animated.spring(insightAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log('AI insight error:', err);
      setAiInsight('Unable to generate insight at this time.');
    } finally {
      setAiLoading(false);
    }
  }, [lastCalculation, getSafetyLevel, insightAnim, material, effect]);

  useEffect(() => {
    if (!lastCalculation || 'error' in lastCalculation) {
      setAiInsight(null);
      insightAnim.setValue(0);
    }
  }, [lastCalculation, insightAnim]);

  const handleReset = useCallback(() => {
    resetInputs();
    setMaterial('');
    setEffect('');
    setActiveStep(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [resetInputs]);

  const canSave = lastCalculation != null && !('error' in lastCalculation);
  const hasResult = lastCalculation != null && !('error' in lastCalculation);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OnboardingModal visible={isFirstLaunch} onDismiss={markSeen} />
      <OnboardingModal visible={showHelp} onDismiss={() => setShowHelp(false)} />

      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.flameIconWrap}>
            <Flame size={18} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.topTitle}>FLAME Calculator</Text>
            <Text style={styles.topSubtitle}>{filledCount}/5 parameters set</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity onPress={handleReset} style={styles.topBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <RotateCcw size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.topBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <HelpCircle size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressBarWrap}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
        </View>
      </View>

      <View style={styles.stepsNav}>
        {FLAME_STEPS.map((step, i) => {
          const filled = flameProgress[step.letter];
          const isActive = activeStep === i;
          return (
            <TouchableOpacity
              key={step.letter}
              style={[
                styles.stepTab,
                isActive && styles.stepTabActive,
                filled && !isActive && styles.stepTabFilled,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveStep(i);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.stepTabLetter,
                { color: isActive ? step.color : filled ? step.color : theme.colors.textTertiary },
              ]}>{step.letter}</Text>
              {filled && !isActive && (
                <View style={[styles.stepDoneIndicator, { backgroundColor: step.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconWrap, { backgroundColor: FLAME_STEPS[activeStep].color + '18' }]}>
            {React.createElement(FLAME_STEPS[activeStep].icon, {
              size: 22,
              color: FLAME_STEPS[activeStep].color,
            })}
          </View>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>{FLAME_STEPS[activeStep].title}</Text>
            <Text style={styles.stepDesc}>{FLAME_STEPS[activeStep].desc}</Text>
          </View>
        </View>

        {activeStep === 0 && (
          <View style={styles.stepContent}>
            <View style={styles.card}>
              <Picker label="Fixture Model" value={selectedFixture} options={fixtureModels} onValueChange={setSelectedFixture} />
              <TouchableOpacity style={styles.qrRow} onPress={openQRScanner} activeOpacity={0.7}>
                <View style={styles.qrIconWrap}>
                  <QrCode size={16} color={theme.colors.accent} />
                </View>
                <View style={styles.qrTextWrap}>
                  <Text style={styles.qrTitle}>Scan QR Code</Text>
                  <Text style={styles.qrSub}>Scan fixture label to auto-select</Text>
                </View>
                <ChevronDown size={16} color={theme.colors.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>
            </View>
            {selectedFixture ? (
              <View style={styles.selectedInfo}>
                <View style={[styles.selectedDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.selectedText}>{selectedFixture} selected</Text>
              </View>
            ) : null}
          </View>
        )}

        {activeStep === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Input label="Vertical Height" value={verticalHeight} onChangeText={setVerticalHeight} keyboardType="decimal-pad" unit="m" placeholder="0.0" />
                </View>
                <View style={styles.inputHalf}>
                  <Input label="Horizontal Dist." value={horizontalDistance} onChangeText={setHorizontalDistance} keyboardType="decimal-pad" unit="m" placeholder="5.0" />
                </View>
              </View>
              <InfoTooltip
                title="Throw Distance"
                body="Vertical Height: mounting height above target (metres).\nHorizontal Distance: horizontal offset from directly below.\nThe app calculates true throw distance using Pythagorean theorem."
              />
            </View>
          </View>
        )}

        {activeStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Input label="Width" value={beamWidth} onChangeText={setBeamWidth} keyboardType="decimal-pad" unit="m" placeholder="6.0" />
                </View>
                <View style={styles.inputHalf}>
                  <Input label="Height" value={beamHeight} onChangeText={setBeamHeight} keyboardType="decimal-pad" unit="m" placeholder="3.0" />
                </View>
              </View>
              <InfoTooltip
                title="Beam Coverage"
                body="Define the rectangular target area you want to illuminate. The calculator verifies if the fixture beam angle covers your target at the given throw distance."
              />
            </View>
          </View>
        )}

        {activeStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.card}>
              <Picker label="Material Type" value={material} options={MATERIAL_OPTIONS} onValueChange={setMaterial} />
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Material matters</Text>
              <Text style={styles.tipText}>Different materials reflect UV light differently. Fluorescent paint has the highest reactivity, while fabric may need higher irradiance levels.</Text>
            </View>
          </View>
        )}

        {activeStep === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.card}>
              <Picker label="Desired Effect" value={effect} options={EFFECT_OPTIONS} onValueChange={setEffect} />
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Choose wisely</Text>
              <Text style={styles.tipText}>A full wash requires wider beam angles and more fixtures, while accent spots can use narrow-beam models at longer throws.</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.volumeToggle}
          onPress={() => setShowVolume(!showVolume)}
          activeOpacity={0.7}
        >
          <Text style={styles.volumeToggleText}>Volume (Optional)</Text>
          <ChevronDown size={16} color={theme.colors.textTertiary} style={showVolume ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </TouchableOpacity>

        {showVolume && (
          <View style={[styles.card, { marginHorizontal: 16 }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputThird}>
                <Input label="H" value={rectHeight} onChangeText={setRectHeight} keyboardType="decimal-pad" unit="m" placeholder="3.0" />
              </View>
              <View style={styles.inputThird}>
                <Input label="W" value={rectWidth} onChangeText={setRectWidth} keyboardType="decimal-pad" unit="m" placeholder="6.0" />
              </View>
              <View style={styles.inputThird}>
                <Input label="D" value={rectDepth} onChangeText={setRectDepth} keyboardType="decimal-pad" unit="m" placeholder="6.0" />
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <Animated.View style={{ flex: 1, transform: [{ scale: calcBtnScale }] }}>
            <TouchableOpacity
              style={[styles.calcButton, isCalculating && styles.calcButtonDisabled]}
              onPress={handleCalculate}
              disabled={isCalculating}
              activeOpacity={0.85}
            >
              <Calculator size={18} color="#fff" />
              <Text style={styles.calcButtonText}>{isCalculating ? 'Calculating...' : 'Calculate'}</Text>
            </TouchableOpacity>
          </Animated.View>
          {canSave && (
            <TouchableOpacity style={styles.saveAction} onPress={() => setShowSaveModal(true)} activeOpacity={0.7}>
              <Save size={18} color={theme.colors.success} />
            </TouchableOpacity>
          )}
        </View>

        {lastCalculation && 'error' in lastCalculation && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{lastCalculation.error}</Text>
          </View>
        )}

        {hasResult && (
          <View style={styles.resultSection}>
            <Text style={styles.resultSectionTitle}>Results</Text>
            <View style={styles.resultGrid}>
              {(() => {
                const r = (lastCalculation as any).irradiance_report;
                const safety = getSafetyLevel(lastCalculation);
                const safetyColors: Record<string, string> = {
                  safe: theme.colors.success,
                  caution: theme.colors.warning,
                  warning: theme.colors.safetyOrange,
                  danger: theme.colors.error,
                };
                return (
                  <>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>Throw</Text>
                      <Text style={styles.resultValue}>{r.throw_distance_m.toFixed(1)}</Text>
                      <Text style={styles.resultUnit}>metres</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>Irradiance</Text>
                      <Text style={styles.resultValue}>{r.irradiance_mWm2.toFixed(0)}</Text>
                      <Text style={styles.resultUnit}>mW/m²</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>Beam Area</Text>
                      <Text style={styles.resultValue}>{r.beam_area_m2.toFixed(1)}</Text>
                      <Text style={styles.resultUnit}>m²</Text>
                    </View>
                    <View style={[styles.resultItem, { borderColor: safetyColors[safety] + '40' }]}>
                      <Text style={styles.resultLabel}>Safety</Text>
                      <View style={[styles.safetyBadge, { backgroundColor: safetyColors[safety] + '18' }]}>
                        <View style={[styles.safetyDot, { backgroundColor: safetyColors[safety] }]} />
                        <Text style={[styles.safetyText, { color: safetyColors[safety] }]}>{safety.toUpperCase()}</Text>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>

            <TouchableOpacity
              style={styles.aiInsightBtn}
              onPress={handleAIInsight}
              disabled={aiLoading}
              activeOpacity={0.7}
            >
              <Sparkles size={16} color={theme.colors.primary} />
              <Text style={styles.aiInsightBtnText}>
                {aiLoading ? 'Analyzing...' : 'AI Analysis'}
              </Text>
            </TouchableOpacity>

            {aiInsight && (
              <Animated.View style={[styles.aiInsightCard, { opacity: insightAnim, transform: [{ scale: insightAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
                <View style={styles.aiInsightHeader}>
                  <Sparkles size={14} color={theme.colors.primary} />
                  <Text style={styles.aiInsightTitle}>AI Insight</Text>
                </View>
                <Text style={styles.aiInsightText}>{aiInsight}</Text>
              </Animated.View>
            )}
          </View>
        )}

        <LightSensorCard />

        <View style={{ height: 40 }} />
      </ScrollView>

      <CalculationPreview />
      <QRScanner />
      <SaveCalculationModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveCalculation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  topSubtitle: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressBarBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  stepsNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  stepTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    position: 'relative' as const,
  },
  stepTabActive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepTabFilled: {
    backgroundColor: theme.colors.surface,
  },
  stepTabLetter: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  stepDoneIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: Platform.select({ ios: 20, android: 100, default: 20 }) },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeaderText: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  stepContent: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  inputThird: {
    flex: 1,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  qrIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 107, 240, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrTextWrap: {
    flex: 1,
  },
  qrTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600' as const,
  },
  qrSub: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
    marginBottom: 12,
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.colors.success,
  },
  tipCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    lineHeight: 18,
  },
  volumeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
  },
  volumeToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  calcButtonDisabled: {
    opacity: 0.6,
  },
  calcButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.2,
  },
  saveAction: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  resultSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: theme.colors.text,
  },
  resultUnit: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safetyText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  aiInsightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.glow,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.2)',
  },
  aiInsightBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  aiInsightCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiInsightTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: theme.colors.primary,
    letterSpacing: 0.2,
  },
  aiInsightText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
