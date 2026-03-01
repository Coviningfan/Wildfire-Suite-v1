import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Animated, Easing, Dimensions, Modal, Pressable } from 'react-native';
import { Calculator, QrCode, Sparkles, ChevronDown, RotateCcw, Save, Flame, Target, MapPin, Move, Palette, Wand2, X, Check, Info, Plus, Trash2, AlertCircle } from 'lucide-react-native';
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
import { RoomSimulation } from '@/components/RoomSimulation';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useSettingsStore, convertDistance, convertArea, distanceUnit, areaUnit } from '@/stores/settings-store';
import { CalculationResponse } from '@/types/lighting';

const SCREEN_WIDTH = Dimensions.get('window').width;
const RESULT_ITEM_WIDTH = (SCREEN_WIDTH - 48 - 8) / 2;

const SAFETY_EXPLANATIONS: Record<string, { title: string; threshold: string; action: string }> = {
  safe: {
    title: 'Safe UV Levels',
    threshold: 'Irradiance below 2,500 mW/m²',
    action: 'No special precautions required for brief exposure. Standard UV-reactive materials will fluoresce well at this level.',
  },
  caution: {
    title: 'Moderate UV — Use Caution',
    threshold: 'Irradiance between 2,500–10,000 mW/m²',
    action: 'Limit prolonged direct skin exposure. UV-blocking eyewear recommended for operators working near the beam path.',
  },
  warning: {
    title: 'Warning — PPE Required',
    threshold: 'Irradiance between 10,000–25,000 mW/m²',
    action: 'UV-rated eye protection mandatory. Minimize skin exposure. Post warning signage in the illuminated area.',
  },
  danger: {
    title: 'Danger — High UV Exposure',
    threshold: 'Irradiance above 25,000 mW/m²',
    action: 'Full PPE required (UV goggles, long sleeves). Restrict access to the beam area. Do not look directly at the fixture.',
  },
};

interface ZoneFixture {
  id: string;
  fixture: string;
  verticalHeight: string;
  horizontalDistance: string;
  beamWidth: string;
  beamHeight: string;
}

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
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    selectedFixture, verticalHeight, horizontalDistance,
    beamWidth, beamHeight, rectHeight, rectWidth, rectDepth,
    isCalculating, lastCalculation, showingPreview, isQRScannerOpen,
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
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [safetyModalLevel, setSafetyModalLevel] = useState<string>('safe');
  const [zoneFixtures, setZoneFixtures] = useState<ZoneFixture[]>([]);
  const [roomWidth, setRoomWidth] = useState<string>('12');
  const [roomDepth, setRoomDepth] = useState<string>('8');
  const [roomCeiling, setRoomCeiling] = useState<string>('4');
  const [showSimulation, setShowSimulation] = useState<boolean>(true);

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

  const FLAME_STEPS = useMemo(() => [
    { letter: 'F' as const, title: 'Fixture', icon: Target, color: colors.primary, desc: 'Select your UV light source. Power output, beam angle, and control type vary by model.' },
    { letter: 'L' as const, title: 'Location', icon: MapPin, color: colors.secondary, desc: 'Mounting height + horizontal offset determine throw distance via Pythagorean theorem.' },
    { letter: 'A' as const, title: 'Angle', icon: Move, color: colors.accent, desc: 'Target coverage dimensions. Verifies beam angle covers your desired area at throw distance.' },
    { letter: 'M' as const, title: 'Material', icon: Palette, color: colors.success, desc: 'Surface being lit — paint, fabric, ink each respond differently to UV wavelengths.' },
    { letter: 'E' as const, title: 'Effect', icon: Wand2, color: '#3B82F6', desc: 'Desired visual outcome. Helps optimize fixture selection, intensity, and placement.' },
  ], [colors]);

  const flameProgress = useMemo<Record<FlameLetter, boolean>>(() => ({
    F: !!selectedFixture,
    L: !!verticalHeight || !!horizontalDistance,
    A: !!beamWidth || !!beamHeight,
    M: !!material,
    E: !!effect,
  }), [selectedFixture, verticalHeight, horizontalDistance, beamWidth, beamHeight, material, effect]);

  const stepValidation = useMemo<Record<FlameLetter, { complete: boolean; missing: string[] }>>(() => ({
    F: { complete: !!selectedFixture, missing: !selectedFixture ? ['Select a fixture model'] : [] },
    L: { complete: !!verticalHeight || !!horizontalDistance, missing: (!verticalHeight && !horizontalDistance) ? ['Enter height or distance'] : [] },
    A: { complete: !!beamWidth && !!beamHeight, missing: [!beamWidth ? 'Enter width' : '', !beamHeight ? 'Enter height' : ''].filter(Boolean) },
    M: { complete: !!material, missing: [] },
    E: { complete: !!effect, missing: [] },
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

  const handleStepChange = useCallback((newStep: number) => {
    const currentLetter = FLAME_STEPS[activeStep].letter;
    const validation = stepValidation[currentLetter];
    if (!validation.complete && validation.missing.length > 0 && newStep > activeStep) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    animateStepChange(newStep);
  }, [activeStep, stepValidation, FLAME_STEPS, animateStepChange]);

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

    await calculate(unitSystem);

    Animated.parallel([
      Animated.timing(resultFadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(resultSlideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [selectedFixture, calculate, calcBtnScale, resultFadeAnim, resultSlideAnim, unitSystem]);

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

  const handleSafetyTap = useCallback((level: string) => {
    setSafetyModalLevel(level);
    setShowSafetyModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const addZoneFixture = useCallback(() => {
    const newFixture: ZoneFixture = {
      id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fixture: '',
      verticalHeight: '',
      horizontalDistance: '',
      beamWidth: '',
      beamHeight: '',
    };
    setZoneFixtures(prev => [...prev, newFixture]);
  }, []);

  const removeZoneFixture = useCallback((id: string) => {
    setZoneFixtures(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateZoneFixture = useCallback((id: string, field: keyof ZoneFixture, value: string) => {
    setZoneFixtures(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  }, []);

  const zoneResults = useMemo(() => {
    if (zoneFixtures.length === 0) return null;
    const calc = new LightingCalculator();
    const results: Exclude<CalculationResponse, { error: string }>[] = [];
    for (const zf of zoneFixtures) {
      if (!zf.fixture) continue;
      const result = calc.calculateRadiometricData(
        zf.fixture,
        parseFloat(zf.verticalHeight) || 0,
        parseFloat(zf.horizontalDistance) || 0,
        parseFloat(zf.beamWidth) || 12,
        parseFloat(zf.beamHeight) || 12,
      );
      if (!('error' in result)) {
        results.push(result);
      }
    }
    if (results.length === 0) return null;
    const totalArea = results.reduce((s, r) => s + r.irradiance_report.beam_area_m2, 0);
    const avgIrradiance = results.reduce((s, r) => s + r.irradiance_report.irradiance_mWm2, 0) / results.length;
    const maxIrradiance = Math.max(...results.map(r => r.irradiance_report.irradiance_mWm2));
    return { count: results.length, totalArea, avgIrradiance, maxIrradiance };
  }, [zoneFixtures]);

  const canSave = lastCalculation != null && !('error' in lastCalculation);
  const hasResult = lastCalculation != null && !('error' in lastCalculation);
  const canCalculate = !!selectedFixture && !!beamWidth && !!beamHeight;

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OnboardingModal visible={isFirstLaunch} onDismiss={markSeen} />

      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.flameIconWrap}>
            <Flame size={18} color={colors.primary} />
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
              <RotateCcw size={17} color={colors.textTertiary} />
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
          const hasWarning = isActive && !filled && stepValidation[step.letter].missing.length > 0;
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
                handleStepChange(i);
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
                  { color: isActive ? step.color : colors.textTertiary },
                ]}>{step.letter}</Text>
              )}
              <Text style={[
                styles.stepTabTitle,
                { color: isActive ? step.color : filled ? colors.textSecondary : colors.textTertiary },
              ]}>{step.title}</Text>
              {hasWarning && (
                <View style={[styles.stepIncomplete, { backgroundColor: colors.warning + '20' }]}>
                  <View style={[styles.stepIncompleteDot, { backgroundColor: colors.warning }]} />
                </View>
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
                    <QrCode size={16} color={colors.accent} />
                  </View>
                  <View style={styles.qrTextWrap}>
                    <Text style={styles.qrTitle}>Scan QR Code</Text>
                    <Text style={styles.qrSub}>Scan fixture label to auto-select</Text>
                  </View>
                  <ChevronDown size={16} color={colors.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>
              </View>
              {selectedFixture ? (
                <View style={styles.selectedInfo}>
                  <View style={[styles.selectedDot, { backgroundColor: colors.success }]} />
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
                    <Input label="Vertical Height" value={verticalHeight} onChangeText={setVerticalHeight} keyboardType="decimal-pad" unit={dUnit} placeholder="0.0" />
                  </View>
                  <View style={styles.inputHalf}>
                    <Input label="Horizontal Dist." value={horizontalDistance} onChangeText={setHorizontalDistance} keyboardType="decimal-pad" unit={dUnit} placeholder="5.0" />
                  </View>
                </View>
                <InfoTooltip
                  title="Throw Distance"
                  body={`Vertical Height: mounting height above target (${dUnit}).\nHorizontal Distance: horizontal offset from directly below.\nThe app calculates true throw distance using Pythagorean theorem.`}
                />
              </View>
            </View>
          )}

          {activeStep === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.card}>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Input label="Width" value={beamWidth} onChangeText={setBeamWidth} keyboardType="decimal-pad" unit={dUnit} placeholder="6.0" />
                  </View>
                  <View style={styles.inputHalf}>
                    <Input label="Height" value={beamHeight} onChangeText={setBeamHeight} keyboardType="decimal-pad" unit={dUnit} placeholder="3.0" />
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
          <View style={styles.volumeToggleLeft}>
            <Text style={styles.volumeToggleText}>Volume (Optional)</Text>
            <Text style={styles.volumeToggleHint}>Define a 3D space to calculate total UV exposure within a volume</Text>
          </View>
          <ChevronDown size={16} color={colors.textTertiary} style={showVolume ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </TouchableOpacity>

        {showVolume && (
          <View style={[styles.card, { marginHorizontal: 16 }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputThird}>
                <Input label="H" value={rectHeight} onChangeText={setRectHeight} keyboardType="decimal-pad" unit={dUnit} placeholder="3.0" />
              </View>
              <View style={styles.inputThird}>
                <Input label="W" value={rectWidth} onChangeText={setRectWidth} keyboardType="decimal-pad" unit={dUnit} placeholder="6.0" />
              </View>
              <View style={styles.inputThird}>
                <Input label="D" value={rectDepth} onChangeText={setRectDepth} keyboardType="decimal-pad" unit={dUnit} placeholder="6.0" />
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <Animated.View style={{ flex: 1, transform: [{ scale: calcBtnScale }] }}>
            <TouchableOpacity
              style={[styles.calcButton, (!canCalculate || isCalculating) && styles.calcButtonDisabled]}
              onPress={handleCalculate}
              disabled={!canCalculate || isCalculating}
              activeOpacity={0.85}
            >
              <Calculator size={18} color="#fff" />
              <Text style={styles.calcButtonText}>{isCalculating ? 'Calculating...' : 'Calculate'}</Text>
            </TouchableOpacity>
          </Animated.View>
          {canSave && (
            <TouchableOpacity style={styles.saveAction} onPress={() => setShowSaveModal(true)} activeOpacity={0.7}>
              <Save size={18} color={colors.success} />
            </TouchableOpacity>
          )}
        </View>

        {!canCalculate && selectedFixture ? (
          <View style={styles.calcNote}>
            <Text style={styles.calcNoteText}>Fill in the <Text style={styles.calcNoteBold}>Angle</Text> section to enable calculation. Adding <Text style={styles.calcNoteBold}>Material</Text> and <Text style={styles.calcNoteBold}>Effect</Text> may give better results.</Text>
          </View>
        ) : canCalculate && (!material || !effect) ? (
          <View style={styles.calcNoteOptional}>
            <Text style={styles.calcNoteOptionalText}>Filling <Text style={styles.calcNoteBold}>Material</Text> and <Text style={styles.calcNoteBold}>Effect</Text> sections may give better AI analysis results.</Text>
          </View>
        ) : null}

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
                <X size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <View style={styles.resultGrid}>
              {(() => {
                const r = (lastCalculation as any).irradiance_report;
                const safety = getSafetyLevel(lastCalculation);
                const safetyColorMap: Record<string, string> = {
                  safe: colors.success,
                  caution: colors.warning,
                  warning: colors.safetyOrange,
                  danger: colors.error,
                };
                return (
                  <>
                    <View style={[styles.resultItem, { width: RESULT_ITEM_WIDTH }]}>
                      <Text style={styles.resultLabel}>THROW</Text>
                      <Text style={styles.resultValue}>{convertDistance(r.throw_distance_m, unitSystem).toFixed(1)}</Text>
                      <Text style={styles.resultUnit}>{dUnit}</Text>
                    </View>
                    <View style={[styles.resultItem, { width: RESULT_ITEM_WIDTH }]}>
                      <Text style={styles.resultLabel}>IRRADIANCE</Text>
                      <Text style={styles.resultValue}>{r.irradiance_mWm2.toFixed(0)}</Text>
                      <Text style={styles.resultUnit}>mW/m²</Text>
                    </View>
                    <View style={[styles.resultItem, { width: RESULT_ITEM_WIDTH }]}>
                      <Text style={styles.resultLabel}>BEAM AREA</Text>
                      <Text style={styles.resultValue}>{convertArea(r.beam_area_m2, unitSystem).toFixed(1)}</Text>
                      <Text style={styles.resultUnit}>{aUnit}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.resultItem, { width: RESULT_ITEM_WIDTH, borderColor: safetyColorMap[safety] + '30' }]}
                      onPress={() => handleSafetyTap(safety)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.safetyLabelRow}>
                        <Text style={styles.resultLabel}>SAFETY</Text>
                        <Info size={10} color={colors.textTertiary} />
                      </View>
                      <View style={[styles.safetyBadge, { backgroundColor: safetyColorMap[safety] + '14' }]}>
                        <View style={[styles.safetyDot, { backgroundColor: safetyColorMap[safety] }]} />
                        <Text style={[styles.safetyText, { color: safetyColorMap[safety] }]}>{safety.toUpperCase()}</Text>
                      </View>
                    </TouchableOpacity>
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
                <Sparkles size={16} color={colors.primary} />
              </Animated.View>
              <Text style={styles.aiInsightBtnText}>
                {aiLoading ? 'Analyzing...' : 'AI Analysis'}
              </Text>
            </TouchableOpacity>

            {aiInsight && (
              <Animated.View style={[styles.aiInsightCard, { opacity: insightAnim, transform: [{ scale: insightAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
                <View style={styles.aiInsightHeader}>
                  <Sparkles size={14} color={colors.primary} />
                  <Text style={styles.aiInsightTitle}>AI Insight</Text>
                </View>
                <Text style={styles.aiInsightText}>{aiInsight}</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        <View style={styles.zoneSection}>
          <View style={styles.zoneSectionHeader}>
            <Text style={styles.zoneSectionTitle}>Multi-Fixture Zone</Text>
            <TouchableOpacity style={styles.zoneAddBtn} onPress={addZoneFixture} activeOpacity={0.7}>
              <Plus size={14} color={colors.primary} />
              <Text style={styles.zoneAddBtnText}>Add Fixture</Text>
            </TouchableOpacity>
          </View>
          {zoneFixtures.length > 0 && (
            <Text style={styles.zoneHint}>Add multiple fixtures to calculate combined coverage for a zone</Text>
          )}
          {zoneFixtures.map((zf, idx) => (
            <View key={zf.id} style={styles.zoneFixtureCard}>
              <View style={styles.zoneFixtureHeader}>
                <Text style={styles.zoneFixtureLabel}>Fixture {idx + 1}</Text>
                <TouchableOpacity onPress={() => removeZoneFixture(zf.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Picker label="Model" value={zf.fixture} options={fixtureModels} onValueChange={(v) => updateZoneFixture(zf.id, 'fixture', v)} />
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Input label="Height" value={zf.verticalHeight} onChangeText={(v) => updateZoneFixture(zf.id, 'verticalHeight', v)} keyboardType="decimal-pad" unit={dUnit} placeholder="0.0" />
                </View>
                <View style={styles.inputHalf}>
                  <Input label="H. Dist" value={zf.horizontalDistance} onChangeText={(v) => updateZoneFixture(zf.id, 'horizontalDistance', v)} keyboardType="decimal-pad" unit={dUnit} placeholder="0.0" />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Input label="Width" value={zf.beamWidth} onChangeText={(v) => updateZoneFixture(zf.id, 'beamWidth', v)} keyboardType="decimal-pad" unit={dUnit} placeholder="6.0" />
                </View>
                <View style={styles.inputHalf}>
                  <Input label="Height" value={zf.beamHeight} onChangeText={(v) => updateZoneFixture(zf.id, 'beamHeight', v)} keyboardType="decimal-pad" unit={dUnit} placeholder="3.0" />
                </View>
              </View>
            </View>
          ))}
          {zoneResults && (
            <View style={styles.zoneResultCard}>
              <Text style={styles.zoneResultTitle}>Zone Summary ({zoneResults.count} fixture{zoneResults.count !== 1 ? 's' : ''})</Text>
              <View style={styles.zoneResultRow}>
                <View style={styles.zoneResultStat}>
                  <Text style={styles.zoneResultValue}>{convertArea(zoneResults.totalArea, unitSystem).toFixed(1)}</Text>
                  <Text style={styles.zoneResultLabel}>Total Area ({aUnit})</Text>
                </View>
                <View style={styles.zoneResultStat}>
                  <Text style={styles.zoneResultValue}>{zoneResults.avgIrradiance.toFixed(0)}</Text>
                  <Text style={styles.zoneResultLabel}>Avg mW/m²</Text>
                </View>
                <View style={styles.zoneResultStat}>
                  <Text style={styles.zoneResultValue}>{zoneResults.maxIrradiance.toFixed(0)}</Text>
                  <Text style={styles.zoneResultLabel}>Peak mW/m²</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.simSection}>
            <TouchableOpacity
              style={styles.simToggle}
              onPress={() => { Haptics.selectionAsync(); setShowSimulation(!showSimulation); }}
              activeOpacity={0.7}
            >
              <Text style={styles.simToggleTitle}>Room Simulation</Text>
              <Text style={styles.simToggleHint}>{showSimulation ? 'Hide' : 'Show'} beam visualization</Text>
            </TouchableOpacity>
            {showSimulation && (
              <>
                <View style={styles.roomDimsCard}>
                  <Text style={styles.roomDimsLabel}>Room Dimensions</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputThird}>
                      <Input label="Width" value={roomWidth} onChangeText={setRoomWidth} keyboardType="decimal-pad" unit={dUnit} placeholder="12" />
                    </View>
                    <View style={styles.inputThird}>
                      <Input label="Depth" value={roomDepth} onChangeText={setRoomDepth} keyboardType="decimal-pad" unit={dUnit} placeholder="8" />
                    </View>
                    <View style={styles.inputThird}>
                      <Input label="Ceiling" value={roomCeiling} onChangeText={setRoomCeiling} keyboardType="decimal-pad" unit={dUnit} placeholder="4" />
                    </View>
                  </View>
                </View>
                <RoomSimulation
                  roomWidth={parseFloat(roomWidth) || 0}
                  roomDepth={parseFloat(roomDepth) || 0}
                  roomHeight={parseFloat(roomCeiling) || 0}
                  fixtures={zoneFixtures}
                  unitLabel={dUnit}
                />
              </>
            )}
          </View>
        </View>

        <LightSensorCard />

        <View style={{ height: 40 }} />
      </ScrollView>

      {showingPreview && <CalculationPreview />}
      {isQRScannerOpen && <QRScanner />}

      <Modal visible={showSafetyModal} transparent animationType="fade" onRequestClose={() => setShowSafetyModal(false)}>
        <Pressable style={styles.safetyModalOverlay} onPress={() => setShowSafetyModal(false)}>
          <Pressable style={[styles.safetyModalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={styles.safetyModalHeader}>
              <AlertCircle size={20} color={(() => {
                const c: Record<string, string> = { safe: colors.success, caution: colors.warning, warning: colors.safetyOrange, danger: colors.error };
                return c[safetyModalLevel] || colors.textSecondary;
              })()} />
              <Text style={[styles.safetyModalTitle, { color: colors.text }]}>{SAFETY_EXPLANATIONS[safetyModalLevel]?.title}</Text>
            </View>
            <View style={[styles.safetyModalThreshold, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.safetyModalThresholdText, { color: colors.textSecondary }]}>{SAFETY_EXPLANATIONS[safetyModalLevel]?.threshold}</Text>
            </View>
            <Text style={[styles.safetyModalAction, { color: colors.text }]}>{SAFETY_EXPLANATIONS[safetyModalLevel]?.action}</Text>
            <TouchableOpacity style={[styles.safetyModalClose, { backgroundColor: colors.surfaceSecondary }]} onPress={() => setShowSafetyModal(false)} activeOpacity={0.7}>
              <Text style={[styles.safetyModalCloseText, { color: colors.textSecondary }]}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <SaveCalculationModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveCalculation}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    flameIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.glow, justifyContent: 'center', alignItems: 'center' },
    topTitle: { fontSize: 17, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
    topSubtitle: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    topBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    progressBarWrap: { paddingHorizontal: 16, paddingBottom: 10 },
    progressBarBg: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },
    stepsNav: { flexDirection: 'row', paddingHorizontal: 12, gap: 4, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    stepTab: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2, borderRadius: 10, backgroundColor: colors.surface, gap: 3, borderWidth: 1, borderColor: 'transparent' },
    stepTabActive: { backgroundColor: colors.surfaceElevated },
    stepTabFilled: { backgroundColor: colors.surface },
    stepCheckWrap: { width: 20, height: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    stepTabLetter: { fontSize: 14, fontWeight: '800' as const },
    stepTabTitle: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
    stepIncomplete: { width: 12, height: 12, borderRadius: 6, justifyContent: 'center' as const, alignItems: 'center' as const },
    stepIncompleteDot: { width: 5, height: 5, borderRadius: 2.5 },
    stepAnimWrap: {},
    scrollContainer: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    stepIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    stepHeaderText: { flex: 1, paddingTop: 2 },
    stepTitle: { fontSize: 20, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3, marginBottom: 4 },
    stepDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    stepContent: { paddingHorizontal: 16 },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    inputRow: { flexDirection: 'row', gap: 10 },
    inputHalf: { flex: 1 },
    inputThird: { flex: 1 },
    qrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
    qrIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(124, 107, 240, 0.1)', justifyContent: 'center', alignItems: 'center' },
    qrTextWrap: { flex: 1 },
    qrTitle: { fontSize: 14, color: colors.text, fontWeight: '600' as const },
    qrSub: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
    selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.15)', marginBottom: 12 },
    selectedDot: { width: 6, height: 6, borderRadius: 3 },
    selectedText: { fontSize: 13, fontWeight: '600' as const, color: colors.success },
    tipCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    tipTitle: { fontSize: 13, fontWeight: '700' as const, color: colors.textSecondary, marginBottom: 4 },
    tipText: { fontSize: 12, color: colors.textTertiary, lineHeight: 18 },
    volumeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 4 },
    volumeToggleLeft: { flex: 1, marginRight: 12 },
    volumeToggleText: { fontSize: 14, fontWeight: '600' as const, color: colors.textSecondary },
    volumeToggleHint: { fontSize: 11, color: colors.textTertiary, marginTop: 2, lineHeight: 15 },
    actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginTop: 8, marginBottom: 16 },
    calcButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
    calcButtonDisabled: { opacity: 0.6 },
    calcButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#fff', letterSpacing: 0.2 },
    saveAction: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(34, 197, 94, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
    errorCard: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
    errorText: { color: colors.error, fontSize: 14, textAlign: 'center' as const, fontWeight: '500' as const },
    resultSection: { paddingHorizontal: 16, marginBottom: 16 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    dismissBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    resultSectionTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.2 },
    resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    resultItem: { backgroundColor: colors.surface, padding: 14, borderRadius: 14, alignItems: 'center' as const, borderWidth: 1, borderColor: colors.border },
    safetyLabelRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
    resultLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '600' as const, letterSpacing: 0.8, marginBottom: 6 },
    resultValue: { fontSize: 24, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
    resultUnit: { fontSize: 10, color: colors.textTertiary, fontWeight: '500' as const, marginTop: 2 },
    safetyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 4 },
    safetyDot: { width: 6, height: 6, borderRadius: 3 },
    safetyText: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 0.5 },
    aiInsightBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.glow, borderWidth: 1, borderColor: 'rgba(232, 65, 42, 0.2)' },
    aiInsightBtnLoading: { borderColor: 'rgba(232, 65, 42, 0.35)' },
    aiInsightBtnText: { fontSize: 14, fontWeight: '600' as const, color: colors.primary },
    aiInsightCard: { marginTop: 12, padding: 16, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    aiInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    aiInsightTitle: { fontSize: 13, fontWeight: '700' as const, color: colors.primary, letterSpacing: 0.2 },
    aiInsightText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
    calcNote: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(245, 166, 35, 0.08)', borderWidth: 1, borderColor: 'rgba(245, 166, 35, 0.18)' },
    calcNoteText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, textAlign: 'center' as const },
    calcNoteBold: { fontWeight: '700' as const, color: colors.text },
    calcNoteOptional: { marginHorizontal: 16, marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
    calcNoteOptionalText: { fontSize: 12, color: colors.textTertiary, lineHeight: 18, textAlign: 'center' as const },
    safetyModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' as const, alignItems: 'center' as const, padding: 32 },
    safetyModalContent: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 24 },
    safetyModalHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 16 },
    safetyModalTitle: { fontSize: 17, fontWeight: '700' as const, flex: 1 },
    safetyModalThreshold: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 14 },
    safetyModalThresholdText: { fontSize: 13, fontWeight: '600' as const },
    safetyModalAction: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
    safetyModalClose: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' as const },
    safetyModalCloseText: { fontSize: 14, fontWeight: '600' as const },
    zoneSection: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
    zoneSectionHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 8 },
    zoneSectionTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
    zoneAddBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.glow, borderWidth: 1, borderColor: 'rgba(232, 65, 42, 0.2)' },
    zoneAddBtnText: { fontSize: 12, fontWeight: '600' as const, color: colors.primary },
    zoneHint: { fontSize: 12, color: colors.textTertiary, marginBottom: 10, lineHeight: 17 },
    zoneFixtureCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    zoneFixtureHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 10 },
    zoneFixtureLabel: { fontSize: 13, fontWeight: '700' as const, color: colors.textSecondary },
    zoneResultCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 14, marginTop: 4, borderWidth: 1, borderColor: colors.border },
    zoneResultTitle: { fontSize: 13, fontWeight: '700' as const, color: colors.text, marginBottom: 10 },
    zoneResultRow: { flexDirection: 'row' as const, gap: 8 },
    zoneResultStat: { flex: 1, alignItems: 'center' as const },
    zoneResultValue: { fontSize: 18, fontWeight: '800' as const, color: colors.text },
    zoneResultLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 2, textAlign: 'center' as const },
    simSection: { marginTop: 12 },
    simToggle: { marginBottom: 8 },
    simToggleTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.text, marginBottom: 2 },
    simToggleHint: { fontSize: 11, color: colors.textTertiary },
    roomDimsCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: colors.border },
    roomDimsLabel: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary, marginBottom: 10 },
  });
}
