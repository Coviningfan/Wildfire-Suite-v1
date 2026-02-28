export interface DMXChannel {
  channel: number;
  function: string;
  range: string;
}

export const FIXTURE_SERIES_LABELS: Record<string, string> = {
  VSP: 'VSP — VioStorm UV LED',
  EM: 'EM — Effects Master',
  UB: 'UB — UltraBlack',
  UR: 'UR — UltraRay',
  L: 'L — SableLED / SableLux',
};

export function getFixtureCategory(model: string): string {
  if (model.startsWith('VSP')) return 'VSP — VioStorm UV LED (High Power)';
  if (model.startsWith('EM')) return 'EM — Effects Master (Fluorescent/LED)';
  if (model.startsWith('UB')) return 'UB — UltraBlack Fluorescent';
  if (model.startsWith('UR')) return 'UR — UltraRay Compact Fluorescent';
  if (model.startsWith('L')) return 'L — SableLED / SableLux Lamps';
  return 'Other';
}

export function getFixtureSeries(model: string): string {
  if (model.startsWith('VSP')) return 'VioStorm LED';
  if (model.startsWith('EM-44V')) return 'Effects Master VHO';
  if (model.startsWith('EM-4') || model.startsWith('EM-2')) return 'Effects Master Energy/LED';
  if (model.startsWith('UB')) return 'UltraBlack';
  if (model.startsWith('UR')) return 'UltraRay';
  if (model.startsWith('L')) return 'SableLED / SableLux Lamp';
  return 'Wildfire Lighting';
}

export function getFixtureControlType(model: string): string {
  if (model.startsWith('VSP')) return 'DMX / RDM';
  return 'On/Off (Mains)';
}

export function getFixtureDMXChannels(model: string): DMXChannel[] | null {
  if (!model.startsWith('VSP')) return null;
  return [
    { channel: 1, function: 'Dimming Coarse', range: '0-255 (0-100%)' },
    { channel: 2, function: 'Dimming Fine', range: '0-255 (16-bit)' },
    { channel: 3, function: 'Effects / Strobe', range: '0=off 1-10=strobe' },
  ];
}

/**
 * Power consumption (watts) — wall draw from official TDS spec sheets.
 * VSP values are total fixture consumption (not LED wattage).
 * EM-44V is the VHO fluorescent series (300W total).
 * EM LED series values are fixture consumption per TDS.
 * UB / UR values are fixture consumption per TDS.
 * L-series lamps are individual lamp wattages.
 */
export function getFixturePowerWatts(model: string): number | null {
  // VSP-120 series: 175W consumption (TDS 215-066-05)
  if (model === 'VSP-120F' || model === 'VSP-120S' || model === 'VSP-120WS') return 175;
  // VSP-60 series: 86W consumption (TDS 215-065-05)
  if (model === 'VSP-60F' || model === 'VSP-60S' || model === 'VSP-60WS') return 86;
  // Effects Master VHO fluorescent
  if (model === 'EM-44V') return 300;
  // Effects Master LED series (TDS 215-079-05, 215-078-04, 215-084-04)
  if (model === 'EM-44L') return 60;
  if (model === 'EM-42L') return 30;
  if (model === 'EM-22L') return 18;
  // Effects Master Energy series
  if (model === 'EM-43E') return 108;
  if (model === 'EM-42E') return 88;
  // UltraBlack series
  if (model === 'UB-44') return 150;
  if (model === 'UB-42') return 80;
  if (model === 'UB-41') return 40;
  if (model === 'UB-21') return 20;
  // UltraRay series
  if (model === 'UR-46') return 96;
  if (model === 'UR-22') return 44;
  if (model === 'UR-12') return 22;
  return null;
}

/**
 * Total radiant UV output — sourced from official TDS spec sheets.
 * VSP values are total fixture radiant power in mW.
 * EM LED values are fixture-level radiant power density at 0.5m (mW/m²),
 * as stated on TDS sheets (not comparable to VSP mW totals).
 */
export function getFixtureRadiantPower(model: string): { value: number; unit: string } | null {
  // VSP-120: 24,480 mW total radiant power (TDS 215-066-05)
  if (model === 'VSP-120F' || model === 'VSP-120S' || model === 'VSP-120WS') return { value: 24480, unit: 'mW' };
  // VSP-60: 12,240 mW total radiant power (TDS 215-065-05)
  if (model === 'VSP-60F' || model === 'VSP-60S' || model === 'VSP-60WS') return { value: 12240, unit: 'mW' };
  // EM LED series radiant power at 0.5m (TDS sheets)
  if (model === 'EM-44L') return { value: 2400, unit: 'mW/m² @0.5m' };
  if (model === 'EM-42L') return { value: 1200, unit: 'mW/m² @0.5m' };
  if (model === 'EM-22L') return { value: 800, unit: 'mW/m² @0.5m' };
  return null;
}

export function getFixtureNotes(model: string): string | null {
  if (model.startsWith('VSP-120')) {
    return 'Highest-output UV LED fixture. 175W consumption, 24,480mW radiant output. Ideal for long-throw applications (6-15m). Supports interchangeable silicone optics. RDM supported.';
  }
  if (model.startsWith('VSP-60')) {
    return 'Half the radiant output of VSP-120 (12,240mW) at 86W consumption. Identical optic options. Best for medium-throw (3-8m). Full DMX/RDM support.';
  }
  if (model === 'EM-44V') {
    return 'Highest-output fluorescent UV fixture. 300W, can daisy-chain up to 3 units per 20A circuit. Best for wash/ambient UV flooding.';
  }
  if (model.startsWith('EM') && model.includes('L')) {
    return 'Effects Master LED Series uses SableLED lamps. 42.5% more UV output than Energy Series. Flicker and RF interference free.';
  }
  if (model.startsWith('EM') && model.includes('E')) {
    return 'Effects Master Energy Series. Electronic HO ballast, Power Factor > 98%. Universal 120-250VAC input.';
  }
  if (model.startsWith('UB')) {
    return 'Broad-area UV wash. Wide 120° beam ideal for haunted attractions, escape rooms, and blacklight theatre.';
  }
  if (model.startsWith('UR')) {
    return 'Compact fluorescent series. Low power, ideal for accent lighting and small spaces.';
  }
  if (model.startsWith('L')) {
    return 'Replacement lamps for Effects Master or UltraBlack housings. 365nm peak UV emission.';
  }
  return null;
}
