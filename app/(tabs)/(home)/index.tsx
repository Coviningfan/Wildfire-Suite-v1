import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { Calculator, QrCode, HelpCircle } from 'lucide-react-native';
import { useLightingStore } from '@/stores/lighting-store';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Picker } from '@/components/ui/Picker';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { PoweredBy } from '@/components/ui/PoweredBy';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OnboardingModal } from '@/components/ui/OnboardingModal';
import { CalculationPreview } from '@/components/CalculationPreview';
import { QRScanner } from '@/components/QRScanner';
import { SaveCalculationModal } from '@/components/SaveCalculationModal';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';

export default function CalculatorScreen() {
  const {
    selectedFixture, verticalHeight, horizontalDistance,
    beamWidth, beamHeight, rectHeight, rectWidth, rectDepth,
    isCalculating, lastCalculation,
    setSelectedFixture, setVerticalHeight, setHorizontalDistance,
    setBeamWidth, setBeamHeight, setRectHeight, setRectWidth, setRectDepth,
    calculate, resetInputs, openQRScanner, saveCalculation,
  } = useLightingStore();

  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isFirstLaunch, markSeen] = useFirstLaunch();

  const fixtureModels = LightingCalculator.getFixtureModels();

  const handleCalculate = useCallback(() => {
    if (!selectedFixture) {
      Alert.alert('Select a Fixture', 'Please choose a fixture model before calculating.');
      return;
    }
    calculate();
  }, [selectedFixture, calculate]);

  const handleSaveCalculation = useCallback((name: string, description?: string, projectId?: string) => {
    saveCalculation(name, description, projectId);
    setShowSaveModal(false);
    Alert.alert('Saved', 'Calculation saved to your history.');
  }, [saveCalculation]);

  const canSave = lastCalculation != null && !('error' in lastCalculation);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OnboardingModal visible={isFirstLaunch} onDismiss={markSeen} />
      <OnboardingModal visible={showHelp} onDismiss={() => setShowHelp(false)} />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Logo size="large" showTagline />
          <View style={styles.titleRow}>
            <View style={styles.calcIconWrap}>
              <Calculator size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>UV Calculator</Text>
            <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.helpBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <HelpCircle size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Enter fixture & distances for instant irradiance</Text>
        </View>

        <Card>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.sectionTitle}>Fixture Selection</Text>
            <InfoTooltip
              title="Choosing a Fixture"
              body="Select the Wildfire fixture you're using. Browse the Fixtures tab for specs. You can also scan a QR code on the fixture label."
            />
          </View>
          <Picker label="Fixture Model" value={selectedFixture} options={fixtureModels} onValueChange={setSelectedFixture} />
          <Button title="Scan Fixture QR Code" onPress={openQRScanner} variant="outline" size="small" icon={<QrCode size={16} color={theme.colors.text} />} />
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <View style={[styles.stepBadge, styles.stepBadge2]}><Text style={styles.stepNum}>2</Text></View>
            <Text style={styles.sectionTitle}>Throw Distance</Text>
            <InfoTooltip
              title="Throw Distance"
              body="Vertical Height: mounting height above target (metres).\nHorizontal Distance: horizontal offset from directly below.\nThe app calculates true throw distance using Pythagorean theorem."
            />
          </View>
          <Input label="Vertical Height" value={verticalHeight} onChangeText={setVerticalHeight} keyboardType="decimal-pad" unit="m" placeholder="e.g. 4.0" />
          <Input label="Horizontal Distance" value={horizontalDistance} onChangeText={setHorizontalDistance} keyboardType="decimal-pad" unit="m" placeholder="e.g. 0.0" />
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <View style={[styles.stepBadge, styles.stepBadge3]}><Text style={styles.stepNum}>3</Text></View>
            <Text style={styles.sectionTitle}>Beam Parameters</Text>
            <InfoTooltip
              title="Beam Width & Height"
              body="Define the rectangular target area you want to illuminate. The calculator will verify if the fixture beam angle covers your target at the given throw distance."
            />
          </View>
          <Input label="Beam Width" value={beamWidth} onChangeText={setBeamWidth} keyboardType="decimal-pad" unit="m" placeholder="e.g. 6.0" />
          <Input label="Beam Height" value={beamHeight} onChangeText={setBeamHeight} keyboardType="decimal-pad" unit="m" placeholder="e.g. 3.0" />
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <View style={[styles.stepBadge, styles.stepBadge4]}><Text style={styles.stepNum}>4</Text></View>
            <Text style={styles.sectionTitle}>Volume (Optional)</Text>
            <InfoTooltip
              title="Rectangular Volume"
              body="Used to estimate total surface area in a 3D space such as a room, stage set, or haunt. Helps estimate fixture quantity for even coverage."
            />
          </View>
          <Input label="Height" value={rectHeight} onChangeText={setRectHeight} keyboardType="decimal-pad" unit="m" placeholder="e.g. 3.0" />
          <Input label="Width" value={rectWidth} onChangeText={setRectWidth} keyboardType="decimal-pad" unit="m" placeholder="e.g. 6.0" />
          <Input label="Depth" value={rectDepth} onChangeText={setRectDepth} keyboardType="decimal-pad" unit="m" placeholder="e.g. 6.0" />
        </Card>

        <View style={styles.buttonContainer}>
          <Button title="Calculate" onPress={handleCalculate} loading={isCalculating} variant="primary" size="large" icon={<Calculator size={18} color="#fff" />} />
          <View style={styles.secondaryButtons}>
            <Button title="Reset" onPress={resetInputs} variant="outline" size="medium" />
            {canSave && (
              <Button title="Save Result" onPress={() => setShowSaveModal(true)} variant="secondary" size="medium" />
            )}
          </View>
        </View>

        {lastCalculation && 'error' in lastCalculation && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{lastCalculation.error}</Text>
          </Card>
        )}

        <PoweredBy />
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
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: Platform.select({ ios: 20, android: 100, default: 20 }) },
  header: { alignItems: 'center', padding: 20, paddingTop: 14, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  calcIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' as const, color: theme.colors.text, flex: 1, letterSpacing: -0.3 },
  helpBtn: { padding: 4 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  stepBadge2: { backgroundColor: theme.colors.accent },
  stepBadge3: { backgroundColor: theme.colors.secondary },
  stepBadge4: { backgroundColor: theme.colors.success },
  stepNum: { fontSize: 12, fontWeight: '800' as const, color: '#fff' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700' as const, color: theme.colors.text, letterSpacing: -0.1 },
  buttonContainer: { paddingHorizontal: 16, marginTop: 4, gap: 10, paddingBottom: 8 },
  secondaryButtons: { flexDirection: 'row', gap: 10 },
  errorCard: { borderColor: theme.colors.error, borderWidth: 1, backgroundColor: 'rgba(239, 68, 68, 0.06)' },
  errorText: { color: theme.colors.error, fontSize: 14, textAlign: 'center' as const, fontWeight: '500' as const },
});
