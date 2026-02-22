import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform, TouchableOpacity, Animated } from 'react-native';
import { Calculator, QrCode, HelpCircle, Sparkles, ChevronDown, RotateCcw, Save } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLightingStore } from '@/stores/lighting-store';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OnboardingModal } from '@/components/ui/OnboardingModal';
import { CalculationPreview } from '@/components/CalculationPreview';
import { QRScanner } from '@/components/QRScanner';
import { SaveCalculationModal } from '@/components/SaveCalculationModal';
import { LightSensorCard } from '@/components/LightSensorCard';
import { Logo } from '@/components/ui/Logo';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { generateText } from '@rork-ai/toolkit-sdk';

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
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const insightAnim = useRef(new Animated.Value(0)).current;

  const fixtureModels = LightingCalculator.getFixtureModels();

  const handleCalculate = useCallback(async () => {
    if (!selectedFixture) {
      Alert.alert('Select a Fixture', 'Please choose a fixture model before calculating.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await calculate();
  }, [selectedFixture, calculate]);

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
      const prompt = `You are a UV lighting expert for Wildfire Lighting. Analyze this calculation result in 2-3 concise sentences. Be practical and specific.

Fixture: ${report.fixture_model}
Throw distance: ${report.throw_distance_m.toFixed(2)}m
Irradiance: ${report.irradiance_mWm2.toFixed(2)} mW/m²
Beam area: ${report.beam_area_m2.toFixed(2)} m²
Safety level: ${safety}
Degradation: ${report.irradiance_degradation_percent.toFixed(1)}%

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
  }, [lastCalculation, getSafetyLevel, insightAnim]);

  useEffect(() => {
    if (!lastCalculation || 'error' in lastCalculation) {
      setAiInsight(null);
      insightAnim.setValue(0);
    }
  }, [lastCalculation, insightAnim]);

  const canSave = lastCalculation != null && !('error' in lastCalculation);
  const hasResult = lastCalculation != null && !('error' in lastCalculation);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OnboardingModal visible={isFirstLaunch} onDismiss={markSeen} />
      <OnboardingModal visible={showHelp} onDismiss={() => setShowHelp(false)} />

      <View style={styles.topBar}>
        <Logo size="small" imageOnly />
        <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.helpBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HelpCircle size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Calculator size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>UV Calculator</Text>
          <Text style={styles.heroSub}>Calculate irradiance for any Wildfire fixture</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepDot}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.sectionTitle}>Fixture</Text>
            <InfoTooltip
              title="Choosing a Fixture"
              body="Select the Wildfire fixture you're using. Browse the Fixtures tab for specs. You can also scan a QR code on the fixture label."
            />
          </View>
          <View style={styles.card}>
            <Picker label="Fixture Model" value={selectedFixture} options={fixtureModels} onValueChange={setSelectedFixture} />
            <TouchableOpacity style={styles.qrRow} onPress={openQRScanner} activeOpacity={0.7}>
              <QrCode size={16} color={theme.colors.accent} />
              <Text style={styles.qrText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.stepDot, { backgroundColor: theme.colors.secondary }]}><Text style={styles.stepNum}>2</Text></View>
            <Text style={styles.sectionTitle}>Distance</Text>
            <InfoTooltip
              title="Throw Distance"
              body="Vertical Height: mounting height above target (metres).\nHorizontal Distance: horizontal offset from directly below.\nThe app calculates true throw distance using Pythagorean theorem."
            />
          </View>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Input label="Vertical Height" value={verticalHeight} onChangeText={setVerticalHeight} keyboardType="decimal-pad" unit="m" placeholder="0.0" />
              </View>
              <View style={styles.inputHalf}>
                <Input label="Horizontal Dist." value={horizontalDistance} onChangeText={setHorizontalDistance} keyboardType="decimal-pad" unit="m" placeholder="5.0" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.stepDot, { backgroundColor: theme.colors.accent }]}><Text style={styles.stepNum}>3</Text></View>
            <Text style={styles.sectionTitle}>Beam</Text>
            <InfoTooltip
              title="Beam Width & Height"
              body="Define the rectangular target area you want to illuminate. The calculator will verify if the fixture beam angle covers your target at the given throw distance."
            />
          </View>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Input label="Width" value={beamWidth} onChangeText={setBeamWidth} keyboardType="decimal-pad" unit="m" placeholder="6.0" />
              </View>
              <View style={styles.inputHalf}>
                <Input label="Height" value={beamHeight} onChangeText={setBeamHeight} keyboardType="decimal-pad" unit="m" placeholder="3.0" />
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.volumeToggle}
          onPress={() => setShowVolume(!showVolume)}
          activeOpacity={0.7}
        >
          <View style={[styles.stepDot, { backgroundColor: theme.colors.success }]}><Text style={styles.stepNum}>4</Text></View>
          <Text style={styles.volumeToggleText}>Volume (Optional)</Text>
          <ChevronDown size={16} color={theme.colors.textTertiary} style={showVolume ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </TouchableOpacity>

        {showVolume && (
          <View style={styles.card}>
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
          <TouchableOpacity style={styles.resetAction} onPress={resetInputs} activeOpacity={0.7}>
            <RotateCcw size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.calcButton, isCalculating && styles.calcButtonDisabled]}
            onPress={handleCalculate}
            disabled={isCalculating}
            activeOpacity={0.85}
          >
            <Calculator size={18} color="#fff" />
            <Text style={styles.calcButtonText}>{isCalculating ? 'Calculating...' : 'Calculate'}</Text>
          </TouchableOpacity>
          {canSave && (
            <TouchableOpacity style={styles.saveAction} onPress={() => setShowSaveModal(true)} activeOpacity={0.7}>
              <Save size={16} color={theme.colors.success} />
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
                      <Text style={styles.resultValue}>{r.throw_distance_m.toFixed(1)}m</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>Irradiance</Text>
                      <Text style={styles.resultValue}>{r.irradiance_mWm2.toFixed(0)}</Text>
                      <Text style={styles.resultUnit}>mW/m²</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>Beam Area</Text>
                      <Text style={styles.resultValue}>{r.beam_area_m2.toFixed(1)}m²</Text>
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

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Powered by <Text style={styles.footerBrand}>JABVLabs</Text></Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  helpBtn: { padding: 4 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: Platform.select({ ios: 20, android: 100, default: 20 }) },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#fff',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
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
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: '600' as const,
  },
  volumeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 4,
  },
  volumeToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: theme.colors.text,
    letterSpacing: -0.1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  resetAction: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calcButton: {
    flex: 1,
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
    width: 48,
    height: 48,
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
    fontSize: 20,
    fontWeight: '800' as const,
    color: theme.colors.text,
  },
  resultUnit: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '500' as const,
    marginTop: 1,
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
  footer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  footerDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 14,
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  footerBrand: {
    color: theme.colors.primary,
    fontWeight: '700' as const,
  },
});
