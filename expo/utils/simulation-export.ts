import { Platform } from 'react-native';
import { SAFETY_THRESHOLDS, DOSE_THRESHOLDS } from '@/types/lighting';
import { SURFACE_MATERIALS } from '@/constants/materials';

interface ExportResult {
  success: boolean;
  uri?: string;
  error?: string;
}

interface FixtureExportData {
  model: string;
  xPos: number;
  zPos: number;
  verticalHeight: number;
  horizontalDistance: number;
  beamDiamH: number;
  beamDiamV: number;
  irradiance: number;
  safetyLevel: string;
  tiltAngle: number;
}

interface SurfaceStats {
  surface: string;
  minIrr: number;
  maxIrr: number;
  avgIrr: number;
  coverage: number;
  cellCount: number;
}

interface SimulationExportParams {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  unitLabel: string;
  fixtures: FixtureExportData[];
  surfaceStats: SurfaceStats[];
  exposureMinutes: number;
  floorMaterial: string;
  ceilingMaterial: string;
  wallMaterial: string;
}

function getSafetyLabel(irradiance: number): string {
  if (irradiance > SAFETY_THRESHOLDS.danger) return 'DANGER';
  if (irradiance > SAFETY_THRESHOLDS.warning) return 'WARNING';
  if (irradiance > SAFETY_THRESHOLDS.caution) return 'CAUTION';
  return 'SAFE';
}

function buildSimulationReport(params: SimulationExportParams): string {
  const {
    roomWidth, roomDepth, roomHeight, unitLabel,
    fixtures, surfaceStats, exposureMinutes,
    floorMaterial, ceilingMaterial, wallMaterial,
  } = params;

  const divider = '═'.repeat(56);
  const thin = '─'.repeat(56);
  const lines: string[] = [];

  lines.push(divider);
  lines.push('  WILDFIRE LIGHTING — ROOM SIMULATION REPORT');
  lines.push(divider);
  lines.push('');
  lines.push(`Generated:  ${new Date().toLocaleString()}`);
  lines.push('');

  lines.push('─── ROOM CONFIGURATION ───');
  lines.push(`Width:      ${roomWidth.toFixed(1)} ${unitLabel}`);
  lines.push(`Depth:      ${roomDepth.toFixed(1)} ${unitLabel}`);
  lines.push(`Height:     ${roomHeight.toFixed(1)} ${unitLabel}`);
  lines.push(`Floor Area: ${(roomWidth * roomDepth).toFixed(1)} ${unitLabel}²`);
  lines.push(`Volume:     ${(roomWidth * roomDepth * roomHeight).toFixed(1)} ${unitLabel}³`);
  lines.push('');

  const getMaterialLabel = (id: string) =>
    SURFACE_MATERIALS.find((m) => m.id === id)?.label ?? 'Default';

  lines.push('─── SURFACE MATERIALS ───');
  lines.push(`Floor:      ${getMaterialLabel(floorMaterial)}`);
  lines.push(`Ceiling:    ${getMaterialLabel(ceilingMaterial)}`);
  lines.push(`Walls:      ${getMaterialLabel(wallMaterial)}`);
  lines.push('');

  lines.push(`─── FIXTURES (${fixtures.length}) ───`);
  fixtures.forEach((f, i) => {
    lines.push(`  Fixture ${i + 1}: ${f.model}`);
    lines.push(`    Position:    X=${f.xPos.toFixed(1)}, Z=${f.zPos.toFixed(1)} ${unitLabel}`);
    lines.push(`    Height:      ${f.verticalHeight.toFixed(1)} ${unitLabel}`);
    lines.push(`    Tilt:        ${f.tiltAngle.toFixed(0)}°`);
    lines.push(`    Beam:        ${f.beamDiamH.toFixed(1)} × ${f.beamDiamV.toFixed(1)} ${unitLabel}`);
    lines.push(`    Irradiance:  ${f.irradiance.toFixed(0)} mW/m²`);
    lines.push(`    Safety:      ${f.safetyLevel}`);
    lines.push('');
  });

  lines.push('─── SURFACE ANALYSIS ───');
  surfaceStats.forEach((s) => {
    lines.push(`  ${s.surface}:`);
    lines.push(`    Min:       ${s.minIrr.toFixed(0)} mW/m²`);
    lines.push(`    Max:       ${s.maxIrr.toFixed(0)} mW/m²`);
    lines.push(`    Average:   ${s.avgIrr.toFixed(0)} mW/m²`);
    lines.push(`    Coverage:  ${s.coverage.toFixed(0)}% above caution`);
    lines.push(`    Safety:    ${getSafetyLabel(s.maxIrr)}`);
    lines.push('');
  });

  if (exposureMinutes > 0) {
    lines.push('─── UV DOSE ANALYSIS ───');
    lines.push(`Exposure Duration: ${exposureMinutes} minutes`);
    lines.push('');

    const floorStats = surfaceStats.find((s) => s.surface === 'Floor');
    if (floorStats) {
      const maxDose = (floorStats.maxIrr / 1000) * (exposureMinutes * 60) / 10;
      const avgDose = (floorStats.avgIrr / 1000) * (exposureMinutes * 60) / 10;
      lines.push(`Floor Max Dose:      ${maxDose.toFixed(1)} mJ/cm²`);
      lines.push(`Floor Avg Dose:      ${avgDose.toFixed(1)} mJ/cm²`);
      lines.push(`ACGIH TLV (365nm):   ${DOSE_THRESHOLDS.acgih_tlv_365nm} mJ/cm²`);

      if (maxDose > DOSE_THRESHOLDS.acgih_tlv_365nm) {
        const safeMinutes = (DOSE_THRESHOLDS.acgih_tlv_365nm * 10 * 1000) / (floorStats.maxIrr * 60);
        lines.push(`*** EXCEEDS TLV — Max safe time: ${safeMinutes.toFixed(1)} min ***`);
      } else {
        lines.push('Within ACGIH TLV limits');
      }
    }
    lines.push('');
  }

  lines.push('─── SAFETY THRESHOLDS ───');
  lines.push(`SAFE:     0 – ${SAFETY_THRESHOLDS.caution} mW/m²`);
  lines.push(`CAUTION:  ${SAFETY_THRESHOLDS.caution} – ${SAFETY_THRESHOLDS.warning} mW/m²`);
  lines.push(`WARNING:  ${SAFETY_THRESHOLDS.warning} – ${SAFETY_THRESHOLDS.danger} mW/m²`);
  lines.push(`DANGER:   > ${SAFETY_THRESHOLDS.danger} mW/m²`);
  lines.push('');
  lines.push(divider);
  lines.push('  Powered by Wildfire Lighting — FLAME UV Suite');
  lines.push(divider);

  return lines.join('\n');
}

function buildSimulationCSV(params: SimulationExportParams): string {
  const { roomWidth, roomDepth, roomHeight, unitLabel, fixtures, surfaceStats, exposureMinutes } = params;

  const sections: string[] = [];

  sections.push('ROOM SIMULATION REPORT');
  sections.push(`Generated,${new Date().toISOString()}`);
  sections.push('');

  sections.push('ROOM DIMENSIONS');
  sections.push(`Width (${unitLabel}),${roomWidth}`);
  sections.push(`Depth (${unitLabel}),${roomDepth}`);
  sections.push(`Height (${unitLabel}),${roomHeight}`);
  sections.push('');

  sections.push('FIXTURES');
  sections.push('Model,X,Z,Height,Tilt,Beam H,Beam V,Irradiance (mW/m²),Safety');
  fixtures.forEach((f) => {
    sections.push(
      `${f.model},${f.xPos.toFixed(1)},${f.zPos.toFixed(1)},${f.verticalHeight.toFixed(1)},${f.tiltAngle.toFixed(0)},${f.beamDiamH.toFixed(1)},${f.beamDiamV.toFixed(1)},${f.irradiance.toFixed(0)},${f.safetyLevel}`
    );
  });
  sections.push('');

  sections.push('SURFACE ANALYSIS');
  sections.push('Surface,Min (mW/m²),Max (mW/m²),Avg (mW/m²),Coverage %,Safety');
  surfaceStats.forEach((s) => {
    sections.push(
      `${s.surface},${s.minIrr.toFixed(0)},${s.maxIrr.toFixed(0)},${s.avgIrr.toFixed(0)},${s.coverage.toFixed(0)},${getSafetyLabel(s.maxIrr)}`
    );
  });

  if (exposureMinutes > 0) {
    sections.push('');
    sections.push('UV DOSE');
    sections.push(`Exposure (min),${exposureMinutes}`);
    const floorStats = surfaceStats.find((s) => s.surface === 'Floor');
    if (floorStats) {
      const maxDose = (floorStats.maxIrr / 1000) * (exposureMinutes * 60) / 10;
      sections.push(`Floor Max Dose (mJ/cm²),${maxDose.toFixed(1)}`);
      sections.push(`ACGIH TLV 365nm (mJ/cm²),${DOSE_THRESHOLDS.acgih_tlv_365nm}`);
    }
  }

  return sections.join('\n');
}

export async function exportSimulationReport(
  params: SimulationExportParams,
  format: 'text' | 'csv' = 'text',
): Promise<ExportResult> {
  const content = format === 'csv' ? buildSimulationCSV(params) : buildSimulationReport(params);
  const ext = format === 'csv' ? 'csv' : 'txt';
  const mime = format === 'csv' ? 'text/csv' : 'text/plain';
  const fileName = `simulation_report_${Date.now()}.${ext}`;

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Export failed on web' };
    }
  }

  try {
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.cache, fileName);
    await file.create({ overwrite: true });
    await file.write(content);

    try {
      const Sharing = await import('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: mime,
          dialogTitle: 'Export Simulation Report',
        });
      }
    } catch {
      console.log('[SimExport] Sharing not available');
    }

    return { success: true, uri: file.uri };
  } catch (error) {
    console.log('[SimExport] Export error:', error);
    return { success: false, error: 'Failed to export simulation report' };
  }
}
