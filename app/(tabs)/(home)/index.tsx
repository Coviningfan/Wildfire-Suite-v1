import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { Calculator, QrCode, Sparkles, ChevronDown, RotateCcw, Save, Flame, Target, MapPin, Move, Palette, Wand2, X, Check } from 'lucide-react-native';
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
import { useSettingsStore, convertDistance, convertArea, distanceUnit, areaUnit } from '@/stores/settings-store';

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
    calculate, resetInputs, openQRScanner, saveCalculation, getSafetyLevel, clearResult,
  } = useLightingStore();

  const { unitSystem } = useSettingsStore();
  const dUnit = distanceUnit(unitSystem);
  const aUnit = areaUnit(unitSystem);

  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [isFirstLaunch, markSeen] = useFirstLaunch();
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const [material, setMaterial] = useState<string>('');
  const [effect, setEffect] = useState<string>('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const resultSlideAnim = useRef(new Animated.Value(20)).current;
  const insightAnim = useRef(new Animated.Value(0)).current;
  const calcBtnScale = useRef(new Animated.Value(1)).current;
  const calcBtnGlow = useRef(new Animated.Value(0)).current;
  const stepContentAnim = useRef(new Animated.Value(1)).current;
  const stepSlideAnim = useRef(new Animated.Value(0)).current;
  const aiPulse = useRef(new Animated.Value(0.6)).current;

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

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progressWidth,
      tension: 40,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [progressWidth, progressAnim]);

  useEffect(() => {
    if (selectedFixture && filledCount >= 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(calcBtnGlow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(calcBtnGlow, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    } else {
      calcBtnGlow.setValue(0);
    }
  }, [selectedFixture, filledCount, calcBtnGlow]);

  useEffect(() => {
    if (aiLoading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(aiPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(aiPulse, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [aiLoading, aiPulse]);

  const animateStepChange = useCallback((newStep: number) => {
    const direction = newStep > activeStep ? 1 : -1;
    Animated.parallel([
      Animated.timing(stepContentAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(stepSlideAnim, { toValue: -15 * direction, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setActiveStep(newStep);
      stepSlideAnim.setValue(15 * direction);
      Animated.parallel([
        Animated.timing(stepContentAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(stepSlideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    });
  }, [activeStep, stepContentAnim, stepSlideAnim]);

  const handleCalculate = useCallback(async () => {
    if (!selectedFixture) {
      Alert.alert('Select a Fixture', 'Please choose a fixture model before calculating.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(calcBtnScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(calcBtnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    resultFadeAnim.setValue(0);
    resultSlideAnim.setValue(20);

    await calculate();

    Animated.parallel([
      Animated.timing(resultFadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(resultSlideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [selectedFixture, calculate, calcBtnScale, resultFadeAnim, resultSlideAnim]);

  const handleSaveCalculation = useCallback((name: string, description?: string, projectId?: string) => {
    const didSave = saveCalculation(name, description, projectId, aiInsight ?? undefined);
    if (didSave) {
      setShowSaveModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Calculation saved to your history.');
    } else {
      Alert.alert('Unable to Save', 'Run a calculation first, then try saving again.');
    }
  }, [saveCalculation, aiInsight]);

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
      insightAnim.setValue(0);
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
    resultFadeAnim.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [resetInputs, resultFadeAnim]);

  const canSave = lastCalculation != null && !('error' in lastCalculation);
  const hasResult = lastCalculation != null && !('error' in lastCalculation);

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const calcBtnShadowOpacity = calcBtnGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.6],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OnboardingModal visible={isFirstLaunch} onDismiss={markSeen} />

      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.flameIconWrap}>
            <Flame size={18} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.topTitle}>FLAME Calculator</Text>
            <Text style={styles.topSubtitle}>
              {filledCount === 0 ? 'Start by selecting a fixture' : `${filledCount}/5 parameters set`}
            </Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          {(filledCount > 0 || hasResult) && (
            <TouchableOpacity onPress={handleReset} style={styles.topBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
              <RotateCcw size={17} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.progressBarWrap}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: animatedProgressWidth }]} />
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
                isActive && [styles.stepTabActive, { borderColor: step.color + '40' }],
                filled && !isActive && styles.stepTabFilled,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                animateStepChange(i);
              }}
              activeOpacity={0.7}
            >
              {filled && !isActive ? (
                <View style={[styles.stepCheckWrap, { backgroundColor: step.color + '20' }]}>
                  <Check size={12} color={step.color} strokeWidth={3} />
                </View>
              ) : (
                <Text style={[
                  styles.stepTabLetter,
                  { color: isActive ? step.color : theme.colors.textTertiary },
                ]}>{step.letter}</Text>
              )}
              <Text style={[
                styles.stepTabTitle,
                { color: isActive ? step.color : filled ? theme.colors.textSecondary : theme.colors.textTertiary },
              ]}>{step.title}</Text>
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
        <Animated.View style={[styles.stepAnimWrap, { opacity: stepContentAnim, transform: [{ translateX: stepSlideAnim }] }]}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepIconWrap, { backgroundColor: FLAME_STEPS[activeStep].color + '14' }]}>
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
        </Animated.View>

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
          <Animated.View style={[styles.resultSection, { opacity: resultFadeAnim, transform: [{ translateY: resultSlideAnim }] }]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultSectionTitle}>Results</Text>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clearResult();
                  setAiInsight(null);
                  insightAnim.setValue(0);
                  resultFadeAnim.setValue(0);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
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
                      <Text style={styles.resultLabel}>THROW</Text>
                      <Text style={styles.resultValue}>{convertDistance(r.throw_distance_m, unitSystem).toFixed(1)}</Text>
                      <Text style={styles.resultUnit}>{dUnit}</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>IRRADIANCE</Text>
                      <Text style={styles.resultValue}>{r.irradiance_mWm2.toFixed(0)}</Text>
                      <Text style={styles.resultUnit}>mW/m²</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>BEAM AREA</Text>
                      <Text style={styles.resultValue}>{convertArea(r.beam_area_m2, unitSystem).toFixed(1)}</Text>
                      <Text style={styles.resultUnit}>{aUnit}</Text>
                    </View>
                    <View style={[styles.resultItem, { borderColor: safetyColors[safety] + '30' }]}>
                      <Text style={styles.resultLabel}>SAFETY</Text>
                      <View style={[styles.safetyBadge, { backgroundColor: safetyColors[safety] + '14' }]}>
                        <View style={[styles.safetyDot, { backgroundColor: safetyColors[safety] }]} />
                        <Text style={[styles.safetyText, { color: safetyColors[safety] }]}>{safety.toUpperCase()}</Text>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>

            <TouchableOpacity
              style={[styles.aiInsightBtn, aiLoading && styles.aiInsightBtnLoading]}
              onPress={handleAIInsight}
              disabled={aiLoading}
              activeOpacity={0.7}
            >
              <Animated.View style={aiLoading ? { opacity: aiPulse } : undefined}>
                <Sparkles size={16} color={theme.colors.primary} />
              </Animated.View>
              <Text style={styles.aiInsightBtnText}>
                {aiLoading ? 'Analyzing...' : 'AI Analysis'}
              </Text>
            </TouchableOpacity>

            {aiInsight && (
              <Animated.View style={[styles.aiInsightCard, { opacity: insightAnim, transform: [{ scale: insightAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
                <View style={styles.aiInsightHeader}>
                  <Sparkles size={14} color={theme.colors.primary} />
                  <Text style={styles.aiInsightTitle}>AI Insight</Text>
                </View>
                <Text style={styles.aiInsightText}>{aiInsight}</Text>
              </Animated.View>
            )}
          </Animated.View>
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
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
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
    paddingHorizontal: 12,
    gap: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  stepTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    gap: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepTabActive: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  stepTabFilled: {
    backgroundColor: theme.colors.surface,
  },
  stepCheckWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTabLetter: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  stepTabTitle: {
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  stepAnimWrap: {},
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dismissBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.colors.text,
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
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: -0.5,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  aiInsightBtnLoading: {
    borderColor: 'rgba(232, 65, 42, 0.35)',
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
