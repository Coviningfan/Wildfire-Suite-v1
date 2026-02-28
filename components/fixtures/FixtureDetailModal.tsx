import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, Linking, Platform,
} from 'react-native';
import { X, Lightbulb, Radio, Zap, Activity, Info, FileDown, ExternalLink, ShoppingCart, Calculator, Share2, Shield, BarChart3, Globe, HelpCircle } from 'lucide-react-native';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { FixtureCoverageCard } from '@/components/fixtures/FixtureCoverageCard';
import { theme } from '@/constants/theme';
import {
  getFixtureCategory,
  getFixtureControlType,
  getFixtureSeries,
  getFixtureDMXChannels,
  getFixturePowerWatts,
  getFixtureRadiantPower,
  getFixtureNotes,
} from '@/utils/fixture-helpers';
import {
  exportTechSheet,
  getFixtureManualUrl,
  getFixtureStoreUrl,
  getFixtureSpecPageUrl,
  getFixtureSafetyGuideUrl,
  getFixtureComparisonUrl,
  getWildfireMainUrl,
  getWildfireSupportUrl,
} from '@/utils/file-helpers';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  model: string;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}

async function openUrl(url: string) {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      const WebBrowser = await import('expo-web-browser');
      await WebBrowser.openBrowserAsync(url);
    }
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Open Link', `Visit: ${url}`);
    }
  }
}

export function FixtureDetailModal({ model, isSelected, onSelect, onClose }: Props) {
  const data = LightingCalculator.getFixtureData(model);
  const controlType = getFixtureControlType(model);
  const isDMX = controlType.includes('DMX');
  const dmxChannels = getFixtureDMXChannels(model);
  const powerWatts = getFixturePowerWatts(model);
  const radiantPower = getFixtureRadiantPower(model);
  const notes = getFixtureNotes(model);
  const storeUrl = getFixtureStoreUrl(model);
  const specPageUrl = getFixtureSpecPageUrl(model);
  const comparisonUrl = getFixtureComparisonUrl(model);
  const safetyGuideUrl = getFixtureSafetyGuideUrl();

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lines = [
      `${model} — Wildfire Lighting`,
      `Series: ${getFixtureSeries(model)}`,
      `Control: ${controlType}`,
    ];
    if (powerWatts) lines.push(`Power Consumption: ${powerWatts}W`);
    if (radiantPower) lines.push(`Radiant Output: ${radiantPower.value.toLocaleString()} ${radiantPower.unit}`);
    if (data) {
      lines.push(`Beam Angle: ${data.beam_h_deg}° × ${data.beam_v_deg}°`);
      lines.push(`Peak Irradiance @ 1m: ${data.peak_irradiance_mWm2.toLocaleString()} mW/m²`);
    }
    if (storeUrl) lines.push(`\nStore: ${storeUrl}`);
    const text = lines.join('\n');

    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        Alert.alert('Copied', 'Fixture info copied to clipboard.');
      } catch {
        Alert.alert('Fixture Info', text);
      }
      return;
    }
    try {
      const Sharing = await import('expo-sharing');
      const { File, Paths } = await import('expo-file-system');
      const file = new File(Paths.cache, `${model}_info.txt`);
      file.create({ overwrite: true });
      file.write(text);
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: `Share ${model} Info` });
      }
    } catch {
      Alert.alert('Fixture Info', text);
    }
  };

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
                <SpecRow label="Peak Power Density" value={`${(data.peak_irradiance_mWm2 / 1000).toFixed(3)} W/m²`} />
                {radiantPower != null && (
                  <SpecRow
                    label="Radiant Output"
                    value={`${radiantPower.value.toLocaleString()} ${radiantPower.unit}`}
                    isLast
                  />
                )}
                {radiantPower == null && (
                  <SpecRow label="Peak Power Density" value={`${(data.peak_irradiance_mWm2 / 1000).toFixed(3)} W/m²`} isLast />
                )}
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

            <View style={styles.docsSection}>
              <Text style={styles.sectionTitle}>Documents & Links</Text>
              <View style={styles.docsGrid}>
                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const result = await exportTechSheet(model);
                    if (result.success) {
                      Alert.alert('Exported', 'Tech sheet exported successfully.');
                    } else {
                      Alert.alert('Error', result.error ?? 'Export failed');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconWrap, { backgroundColor: 'rgba(124, 107, 240, 0.12)' }]}>
                    <FileDown size={16} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.docBtnLabel}>Tech Sheet</Text>
                  <Text style={styles.docBtnSub}>Export .txt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const url = await getFixtureManualUrl(model);
                    if (url) {
                      await openUrl(url);
                    } else {
                      Alert.alert('Not Available', 'Product page not available for this fixture.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconWrap, { backgroundColor: 'rgba(245, 166, 35, 0.12)' }]}>
                    <ExternalLink size={16} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.docBtnLabel}>Product Page</Text>
                  <Text style={styles.docBtnSub}>Manual & specs</Text>
                </TouchableOpacity>

                {storeUrl && (
                  <TouchableOpacity
                    style={styles.docBtn}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await openUrl(storeUrl);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.docIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                      <ShoppingCart size={16} color={theme.colors.success} />
                    </View>
                    <Text style={styles.docBtnLabel}>Store</Text>
                    <Text style={styles.docBtnSub}>Buy / pricing</Text>
                  </TouchableOpacity>
                )}

                {specPageUrl && (
                  <TouchableOpacity
                    style={styles.docBtn}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await openUrl(specPageUrl);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.docIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                      <Calculator size={16} color="#3B82F6" />
                    </View>
                    <Text style={styles.docBtnLabel}>Spec Sheet</Text>
                    <Text style={styles.docBtnSub}>Full specifications</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    await openUrl(safetyGuideUrl);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconWrap, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                    <Shield size={16} color={theme.colors.safetyOrange} />
                  </View>
                  <Text style={styles.docBtnLabel}>Safety Guide</Text>
                  <Text style={styles.docBtnSub}>UV-A exposure</Text>
                </TouchableOpacity>

                {comparisonUrl && (
                  <TouchableOpacity
                    style={styles.docBtn}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await openUrl(comparisonUrl);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.docIconWrap, { backgroundColor: 'rgba(59, 159, 232, 0.12)' }]}>
                      <BarChart3 size={16} color="#3B9FE8" />
                    </View>
                    <Text style={styles.docBtnLabel}>Compare</Text>
                    <Text style={styles.docBtnSub}>Series comparison</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    await openUrl(getWildfireMainUrl());
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconWrap, { backgroundColor: 'rgba(232, 65, 42, 0.12)' }]}>
                    <Globe size={16} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.docBtnLabel}>Website</Text>
                  <Text style={styles.docBtnSub}>wildfirelighting.com</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconWrap, { backgroundColor: 'rgba(155, 109, 255, 0.12)' }]}>
                    <Share2 size={16} color="#9B6DFF" />
                  </View>
                  <Text style={styles.docBtnLabel}>Share</Text>
                  <Text style={styles.docBtnSub}>Send info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docBtn}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    await openUrl(getWildfireSupportUrl());
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                    <HelpCircle size={16} color={theme.colors.success} />
                  </View>
                  <Text style={styles.docBtnLabel}>Support</Text>
                  <Text style={styles.docBtnSub}>Get help</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.btnOutlineText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSelect} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>{isSelected ? 'Selected' : 'Use in Calculator'}</Text>
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
  docsSection: {
    marginBottom: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docBtn: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  docBtnLabel: { fontSize: 13, fontWeight: '600' as const, color: theme.colors.text, marginBottom: 2 },
  docBtnSub: { fontSize: 10, color: theme.colors.textTertiary },
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
