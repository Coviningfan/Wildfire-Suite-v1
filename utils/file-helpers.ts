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

export async function getFixtureManualUrl(model: string): Promise<string | null> {
  const baseUrl = 'https://www.wildfirelighting.com';
  if (model.startsWith('VSP')) {
    return `${baseUrl}/viostorm`;
  }
  if (model.startsWith('EM')) {
    return `${baseUrl}/effects-master`;
  }
  if (model.startsWith('UB')) {
    return `${baseUrl}/ultrablack`;
  }
  if (model.startsWith('UR')) {
    return `${baseUrl}/ultraray`;
  }
  return null;
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
