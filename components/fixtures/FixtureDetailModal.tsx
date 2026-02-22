import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal,
} from 'react-native';
import { X, Lightbulb, Radio, Zap, Activity, Info, FileDown, ExternalLink } from 'lucide-react-native';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { FixtureCoverageCard } from '@/components/fixtures/FixtureCoverageCard';
import { theme } from '@/constants/theme';
import {
  getFixtureCategory,
  getFixtureControlType,
  getFixtureSeries,
  getFixtureDMXChannels,
  getFixturePowerWatts,
  getFixtureNotes,
} from '@/utils/fixture-helpers';
import { exportTechSheet, getFixtureManualUrl } from '@/utils/file-helpers';
import { Alert, Platform } from 'react-native';

interface Props {
  model: string;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}

export function FixtureDetailModal({ model, isSelected, onSelect, onClose }: Props) {
  const data = LightingCalculator.getFixtureData(model);
  const controlType = getFixtureControlType(model);
  const isDMX = controlType.includes('DMX');
  const dmxChannels = getFixtureDMXChannels(model);
  const powerWatts = getFixturePowerWatts(model);
  const notes = getFixtureNotes(model);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.topBar}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Lightbulb size={36} color={theme.colors.primary} />
              </View>
              <Text style={styles.heroModel}>{model}</Text>
              <Text style={styles.heroCategory}>{getFixtureCategory(model)}</Text>
              <Text style={styles.heroSeries}>{getFixtureSeries(model)}</Text>
              <View style={styles.heroBadges}>
                <Badge
                  icon={isDMX ? <Radio size={12} color="#9B6DFF" /> : <Zap size={12} color="#22C55E" />}
                  label={controlType}
                  color={isDMX ? '#9B6DFF' : '#22C55E'}
                />
                {powerWatts != null && (
                  <Badge icon={<Activity size={12} color="#F5A623" />} label={`${powerWatts}W`} color="#F5A623" />
                )}
              </View>
            </View>

            <FixtureCoverageCard model={model} throwDistanceM={3} />

            {data != null && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Photometric Specs</Text>
                <SpecRow label="Beam Angle (H)" value={`${data.beam_h_deg}°`} />
                <SpecRow label="Beam Angle (V)" value={`${data.beam_v_deg}°`} />
                {data.field_h_deg != null && <SpecRow label="Field Angle (H)" value={`${data.field_h_deg}°`} />}
                {data.field_v_deg != null && <SpecRow label="Field Angle (V)" value={`${data.field_v_deg}°`} />}
                <SpecRow label="Peak Irradiance @ 1m" value={`${data.peak_irradiance_mWm2.toLocaleString()} mW/m²`} highlight />
                <SpecRow label="Peak Power Density" value={`${(data.peak_irradiance_mWm2 / 1000).toFixed(3)} W/m²`} isLast />
              </View>
            )}

            {isDMX && dmxChannels != null && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DMX Channel Map</Text>
                {dmxChannels.map((ch, i) => (
                  <View key={ch.channel} style={[styles.dmxRow, i === dmxChannels.length - 1 && styles.dmxRowLast]}>
                    <View style={styles.dmxChWrap}>
                      <Text style={styles.dmxCh}>{ch.channel}</Text>
                    </View>
                    <Text style={styles.dmxFn}>{ch.function}</Text>
                    <Text style={styles.dmxRange}>{ch.range}</Text>
                  </View>
                ))}
              </View>
            )}

            {powerWatts != null && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Power & Circuit</Text>
                <SpecRow label="Consumption" value={`${powerWatts}W`} />
                <SpecRow label="Current @ 120V" value={`${(powerWatts / 120).toFixed(2)}A`} />
                <SpecRow label="Max on 20A (80% rule)" value={`${Math.floor(1920 / powerWatts)} units`} isLast />
              </View>
            )}

            {notes != null && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Application Notes</Text>
                <View style={styles.infoBox}>
                  <Info size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.infoText}>{notes}</Text>
                </View>
              </View>
            )}

            <View style={styles.exportSection}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <View style={styles.exportRow}>
                <TouchableOpacity
                  style={styles.exportBtn}
                  onPress={async () => {
                    const result = await exportTechSheet(model);
                    if (result.success) {
                      Alert.alert('Exported', 'Tech sheet exported successfully.');
                    } else {
                      Alert.alert('Error', result.error ?? 'Export failed');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <FileDown size={16} color={theme.colors.accent} />
                  <Text style={styles.exportBtnText}>Tech Sheet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportBtn}
                  onPress={async () => {
                    const url = await getFixtureManualUrl(model);
                    if (url) {
                      try {
                        const WebBrowser = await import('expo-web-browser');
                        await WebBrowser.openBrowserAsync(url);
                      } catch {
                        Alert.alert('Manual', `Visit: ${url}`);
                      }
                    } else {
                      Alert.alert('Not Available', 'Manual URL not available for this fixture.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ExternalLink size={16} color={theme.colors.secondary} />
                  <Text style={styles.exportBtnText}>Manual</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.btnOutlineText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSelect} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>{isSelected ? 'Selected' : 'Select Fixture'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SpecRow({ label, value, highlight, isLast }: { label: string; value: string; highlight?: boolean; isLast?: boolean }) {
  return (
    <View style={[specStyles.row, isLast === true && specStyles.rowLast]}>
      <Text style={specStyles.label}>{label}</Text>
      <Text style={[specStyles.value, highlight === true && specStyles.highlight]}>{value}</Text>
    </View>
  );
}

function Badge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: color + '18' }]}>
      {icon}
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  text: { fontSize: 12, fontWeight: '700' as const },
});

const specStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 13, color: theme.colors.textSecondary, flex: 1 },
  value: { fontSize: 13, fontWeight: '600' as const, color: theme.colors.text, textAlign: 'right' as const, flex: 1 },
  highlight: { color: theme.colors.primary },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.surfaceElevated },
  closeBtn: { position: 'absolute', right: 0, padding: 4 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: theme.colors.glow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 65, 42, 0.1)',
  },
  heroModel: { fontSize: 24, fontWeight: '800' as const, color: theme.colors.text, textAlign: 'center' as const, letterSpacing: -0.3 },
  heroCategory: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' as const },
  heroSeries: { fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 },
  heroBadges: { flexDirection: 'row', gap: 8, marginTop: 14 },
  section: {
    marginBottom: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: theme.colors.text, marginBottom: 10, letterSpacing: -0.1 },
  dmxRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
  },
  dmxRowLast: { borderBottomWidth: 0 },
  dmxChWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(155, 109, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  dmxCh: { fontSize: 11, fontWeight: '800' as const, color: '#9B6DFF' },
  dmxFn: { flex: 1, fontSize: 12, color: theme.colors.text },
  dmxRange: { fontSize: 11, color: theme.colors.textTertiary },
  infoBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  infoText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
  exportSection: {
    marginBottom: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exportRow: { flexDirection: 'row', gap: 10 },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exportBtnText: { fontSize: 13, fontWeight: '600' as const, color: theme.colors.text },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnOutline: { borderWidth: 1, borderColor: theme.colors.border },
  btnOutlineText: { fontSize: 15, fontWeight: '600' as const, color: theme.colors.text },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '600' as const, color: '#fff' },
});
