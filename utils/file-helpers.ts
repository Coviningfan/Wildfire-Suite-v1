import { Platform, Alert } from 'react-native';

interface ExportResult {
  success: boolean;
  uri?: string;
  error?: string;
}

export async function exportCalculationAsText(
  name: string,
  fixture: string,
  inputs: Record<string, string>,
  result: Record<string, any>,
  safetyLevel: string,
): Promise<ExportResult> {
  if (Platform.OS === 'web') {
    try {
      const content = buildCalculationReport(name, fixture, inputs, result, safetyLevel);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.log('[FileHelpers] Web export error:', error);
      return { success: false, error: 'Export failed on web' };
    }
  }

  try {
    const { File, Paths } = await import('expo-file-system');
    const content = buildCalculationReport(name, fixture, inputs, result, safetyLevel);
    const fileName = `${name.replace(/\s+/g, '_')}_report.txt`;
    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(content);
    console.log('[FileHelpers] File saved to:', file.uri);

    try {
      const Sharing = await import('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Calculation Report',
        });
      }
    } catch (shareError) {
      console.log('[FileHelpers] Sharing not available:', shareError);
    }

    return { success: true, uri: file.uri };
  } catch (error) {
    console.log('[FileHelpers] Export error:', error);
    return { success: false, error: 'Failed to export calculation' };
  }
}

export async function exportCalculationAsCSV(
  calculations: Array<{
    name: string;
    fixture: string;
    timestamp: number;
    safetyLevel: string;
    inputs: Record<string, string>;
    result: Record<string, any>;
  }>,
): Promise<ExportResult> {
  const headers = [
    'Name', 'Fixture', 'Date', 'Safety Level',
    'Vertical Height (m)', 'Horizontal Distance (m)',
    'Beam Width (m)', 'Beam Height (m)',
    'Throw Distance (m)', 'Irradiance (mW/m²)', 'Beam Area (m²)',
  ].join(',');

  const rows = calculations.map(calc => {
    const irr = 'irradiance_report' in calc.result ? calc.result.irradiance_report : null;
    return [
      `"${calc.name}"`,
      `"${calc.fixture}"`,
      `"${new Date(calc.timestamp).toLocaleDateString()}"`,
      `"${calc.safetyLevel}"`,
      calc.inputs.verticalHeight ?? '',
      calc.inputs.horizontalDistance ?? '',
      calc.inputs.beamWidth ?? '',
      calc.inputs.beamHeight ?? '',
      irr?.throw_distance_m?.toFixed(2) ?? '',
      irr?.irradiance_mWm2?.toFixed(2) ?? '',
      irr?.beam_area_m2?.toFixed(2) ?? '',
    ].join(',');
  });

  const csv = [headers, ...rows].join('\n');

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calculations_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'CSV export failed on web' };
    }
  }

  try {
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.cache, 'calculations_export.csv');
    file.create({ overwrite: true });
    file.write(csv);

    try {
      const Sharing = await import('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Calculations CSV',
        });
      }
    } catch {
      console.log('[FileHelpers] Sharing not available for CSV');
    }

    return { success: true, uri: file.uri };
  } catch (error) {
    console.log('[FileHelpers] CSV export error:', error);
    return { success: false, error: 'Failed to export CSV' };
  }
}

function buildCalculationReport(
  name: string,
  fixture: string,
  inputs: Record<string, string>,
  result: Record<string, any>,
  safetyLevel: string,
): string {
  const divider = '═'.repeat(50);
  const lines: string[] = [
    divider,
    '  WILDFIRE LIGHTING — UV CALCULATION REPORT',
    divider,
    '',
    `Report Name:      ${name}`,
    `Fixture Model:    ${fixture}`,
    `Safety Level:     ${safetyLevel.toUpperCase()}`,
    `Generated:        ${new Date().toLocaleString()}`,
    '',
    '─── INPUT PARAMETERS ───',
    `Vertical Height:      ${inputs.verticalHeight ?? '—'} m`,
    `Horizontal Distance:  ${inputs.horizontalDistance ?? '—'} m`,
    `Beam Width:           ${inputs.beamWidth ?? '—'} m`,
    `Beam Height:          ${inputs.beamHeight ?? '—'} m`,
    `Rect Height:          ${inputs.rectHeight ?? '—'} m`,
    `Rect Width:           ${inputs.rectWidth ?? '—'} m`,
    `Rect Depth:           ${inputs.rectDepth ?? '—'} m`,
    '',
  ];

  if ('irradiance_report' in result) {
    const irr = result.irradiance_report;
    lines.push(
      '─── IRRADIANCE REPORT ───',
      `Throw Distance:       ${irr.throw_distance_m?.toFixed(3) ?? '—'} m  (${irr.throw_distance_ft?.toFixed(2) ?? '—'} ft)`,
      `Beam Diameter (H):    ${irr.beam_diameter_h_m?.toFixed(3) ?? '—'} m`,
      `Beam Diameter (V):    ${irr.beam_diameter_v_m?.toFixed(3) ?? '—'} m`,
      `Beam Area:            ${irr.beam_area_m2?.toFixed(3) ?? '—'} m²`,
      `Irradiance:           ${irr.irradiance_mWm2?.toFixed(3) ?? '—'} mW/m²`,
      `                      ${irr.irradiance_uWcm2?.toFixed(3) ?? '—'} µW/cm²`,
      `                      ${irr.irradiance_Wm2?.toFixed(6) ?? '—'} W/m²`,
      `Degradation:          ${irr.irradiance_degradation_percent?.toFixed(2) ?? '—'}%`,
      '',
    );

    const beam = result.beam_calculators;
    if (beam) {
      lines.push(
        '─── BEAM CALCULATORS ───',
        `Throw Required:       ${beam.throw_distance_required_m?.toFixed(3) ?? '—'} m`,
        `Beam Angle (H):       ${beam.beam_angle_h_deg?.toFixed(2) ?? '—'}°`,
        `Beam Angle (V):       ${beam.beam_angle_v_deg?.toFixed(2) ?? '—'}°`,
        `Multiplying Factor:   ${beam.multiplying_factor?.toFixed(4) ?? '—'}`,
        `Beam Spread:          ${beam.beam_spread_m?.toFixed(3) ?? '—'} m`,
        `Rectangular Volume:   ${beam.rectangular_volume_m3?.toFixed(3) ?? '—'} m³`,
        '',
      );
    }
  }

  lines.push(
    divider,
    '  Powered by Wildfire Lighting',
    divider,
  );

  return lines.join('\n');
}

const MANUAL_URLS: Record<string, string> = {
  'VSP-120F': 'https://wildfirelighting.com/products/viostorm-uv-led-lighting-series/',
  'VSP-120S': 'https://wildfirelighting.com/products/viostorm-uv-led-lighting-series/',
  'VSP-120WS': 'https://wildfirelighting.com/products/viostorm-uv-led-lighting-series/',
  'VSP-60F': 'https://wildfirelighting.com/products/viostorm-uv-led-lighting-series/',
  'VSP-60S': 'https://wildfirelighting.com/products/viostorm-uv-led-lighting-series/',
  'VSP-60WS': 'https://wildfirelighting.com/products/viostorm-uv-led-lighting-series/',
  'EM-44V': 'https://wildfirelighting.com/products/effects-master-series/',
  'EM-44L': 'https://wildfirelighting.com/products/effects-master-series/',
  'EM-42L': 'https://wildfirelighting.com/products/effects-master-series/',
  'EM-22L': 'https://wildfirelighting.com/products/effects-master-series/',
  'EM-43E': 'https://wildfirelighting.com/products/effects-master-series/',
  'EM-42E': 'https://wildfirelighting.com/products/effects-master-series/',
  'UB-44': 'https://wildfirelighting.com/products/ultrablack-series/',
  'UB-42': 'https://wildfirelighting.com/products/ultrablack-series/',
  'UB-41': 'https://wildfirelighting.com/products/ultrablack-series/',
  'UB-21': 'https://wildfirelighting.com/products/ultrablack-series/',
  'UR-46': 'https://wildfirelighting.com/products/ultraray-series/',
  'UR-22': 'https://wildfirelighting.com/products/ultraray-series/',
  'UR-12': 'https://wildfirelighting.com/products/ultraray-series/',
};

export async function getFixtureManualUrl(model: string): Promise<string | null> {
  if (MANUAL_URLS[model]) return MANUAL_URLS[model];
  const base = 'https://wildfirelighting.com/products';
  if (model.startsWith('VSP')) return `${base}/viostorm-uv-led-lighting-series/`;
  if (model.startsWith('EM')) return `${base}/effects-master-series/`;
  if (model.startsWith('UB')) return `${base}/ultrablack-series/`;
  if (model.startsWith('UR')) return `${base}/ultraray-series/`;
  if (model.startsWith('L')) return `${base}/sablelux-sableled-lamps/`;
  return null;
}

const STORE_URLS: Record<string, string> = {
  'VSP-120F': 'https://store.wildfirelighting.com/lighting/viostorm-led-series/',
  'VSP-120S': 'https://store.wildfirelighting.com/lighting/viostorm-led-series/viostorm-vs-120s-120w-365nm-uv-led-spot/',
  'VSP-120WS': 'https://store.wildfirelighting.com/lighting/viostorm-led-series/viostorm-vs-120ws-120w-365nm-uv-led-wide-spot/',
  'VSP-60F': 'https://store.wildfirelighting.com/lighting/viostorm-led-series/viostorm-vs-60f-60w-365nm-uv-led-flood/',
  'VSP-60S': 'https://store.wildfirelighting.com/lighting/viostorm-led-series/viostorm-vs-60s-60w-365nm-uv-led-spot/',
  'VSP-60WS': 'https://store.wildfirelighting.com/lighting/viostorm-led-series/',
  'EM-44V': 'https://store.wildfirelighting.com/lighting/',
  'EM-44L': 'https://store.wildfirelighting.com/lighting/',
  'EM-42L': 'https://store.wildfirelighting.com/lighting/',
  'EM-22L': 'https://store.wildfirelighting.com/lighting/',
  'EM-43E': 'https://store.wildfirelighting.com/lighting/',
  'EM-42E': 'https://store.wildfirelighting.com/lighting/',
  'UB-44': 'https://store.wildfirelighting.com/lighting/',
  'UB-42': 'https://store.wildfirelighting.com/lighting/',
  'UB-41': 'https://store.wildfirelighting.com/lighting/',
  'UB-21': 'https://store.wildfirelighting.com/lighting/',
  'UR-46': 'https://store.wildfirelighting.com/lighting/',
  'UR-22': 'https://store.wildfirelighting.com/lighting/',
  'UR-12': 'https://store.wildfirelighting.com/lighting/',
};

export function getFixtureStoreUrl(model: string): string | null {
  if (STORE_URLS[model]) return STORE_URLS[model];
  const store = 'https://store.wildfirelighting.com';
  if (model.startsWith('VSP')) return `${store}/lighting/viostorm-led-series/`;
  if (model.startsWith('EM')) return `${store}/lighting/`;
  if (model.startsWith('UB')) return `${store}/lighting/`;
  if (model.startsWith('UR')) return `${store}/lighting/`;
  if (model.startsWith('L')) return `${store}/sableled-led-blb-lamps/`;
  return null;
}

export function getFixtureSpecPageUrl(model: string): string | null {
  const base = 'https://wildfirelighting.com/products';
  if (model.startsWith('VSP')) return `${base}/viostorm-uv-led-lighting-series/#specifications`;
  if (model.startsWith('EM')) return `${base}/effects-master-series/#specifications`;
  if (model.startsWith('UB')) return `${base}/ultrablack-series/#specifications`;
  if (model.startsWith('UR')) return `${base}/ultraray-series/#specifications`;
  if (model.startsWith('L')) return `${base}/sablelux-sableled-lamps/#specifications`;
  return null;
}

export function getFixtureSafetyGuideUrl(): string {
  return 'https://wildfirelighting.com/uv-safety/';
}

export function getFixtureComparisonUrl(model: string): string | null {
  const base = 'https://wildfirelighting.com/products';
  if (model.startsWith('VSP')) return `${base}/viostorm-uv-led-lighting-series/#comparison`;
  if (model.startsWith('EM')) return `${base}/effects-master-series/#comparison`;
  if (model.startsWith('UB')) return `${base}/ultrablack-series/#comparison`;
  if (model.startsWith('UR')) return `${base}/ultraray-series/#comparison`;
  return null;
}

export function getWildfireMainUrl(): string {
  return 'https://wildfirelighting.com';
}

export function getWildfireSupportUrl(): string {
  return 'https://wildfirelighting.com/contact/';
}

export function getFixtureTechSheetContent(model: string): string {
  const divider = '═'.repeat(50);
  const lines: string[] = [
    divider,
    `  WILDFIRE LIGHTING — TECHNICAL SHEET`,
    `  Model: ${model}`,
    divider,
    '',
  ];

  if (model.startsWith('VSP')) {
    lines.push(
      'Series: VioStorm UV LED (High Power)',
      'Control: DMX 512 / RDM',
      'Wavelength: 365nm (UV-A)',
      'Dimming: 16-bit (Coarse + Fine)',
      'Input Voltage: 100-240VAC 50/60Hz',
      'IP Rating: IP20 (Indoor)',
      'Optics: Interchangeable Silicone Lenses',
      '',
      'DMX Channels:',
      '  Ch 1: Dimming Coarse (0-255)',
      '  Ch 2: Dimming Fine (0-255)',
      '  Ch 3: Effects / Strobe',
      '',
    );
  } else if (model.startsWith('EM')) {
    lines.push(
      'Series: Effects Master',
      'Control: On/Off (Mains)',
      'Wavelength: 365-370nm (UV-A)',
      'Input Voltage: 120-250VAC Universal',
      '',
    );
  } else if (model.startsWith('UB')) {
    lines.push(
      'Series: UltraBlack Fluorescent',
      'Control: On/Off (Mains)',
      'Wavelength: 365nm (UV-A)',
      'Beam Angle: 120°',
      '',
    );
  } else if (model.startsWith('UR')) {
    lines.push(
      'Series: UltraRay Compact Fluorescent',
      'Control: On/Off (Mains)',
      'Wavelength: 365nm (UV-A)',
      '',
    );
  }

  lines.push(
    '─── SAFETY INFORMATION ───',
    'UV-A (365nm) Safety Guidelines:',
    '  0 - 2,500 mW/m²:     SAFE — Normal operation',
    '  2,501 - 10,000 mW/m²: CAUTION — Limit exposure to 5 min',
    '  10,001 - 25,000 mW/m²: WARNING — Max 1 min, full PPE',
    '  > 25,000 mW/m²:       DANGER — Immediate evacuation',
    '',
    divider,
    '  For full documentation visit wildfirelighting.com',
    divider,
  );

  return lines.join('\n');
}

export async function exportTechSheet(model: string): Promise<ExportResult> {
  const content = getFixtureTechSheetContent(model);

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model}_tech_sheet.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch {
      return { success: false, error: 'Export failed on web' };
    }
  }

  try {
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.cache, `${model}_tech_sheet.txt`);
    file.create({ overwrite: true });
    file.write(content);

    try {
      const Sharing = await import('expo-sharing');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: `${model} Tech Sheet`,
        });
      }
    } catch {
      console.log('[FileHelpers] Sharing not available for tech sheet');
    }

    return { success: true, uri: file.uri };
  } catch (error) {
    console.log('[FileHelpers] Tech sheet export error:', error);
    return { success: false, error: 'Failed to export tech sheet' };
  }
}
