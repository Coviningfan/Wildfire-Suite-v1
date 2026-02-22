export interface FixtureData {
  beam_h_deg: number;
  beam_v_deg: number;
  field_h_deg?: number;
  field_v_deg?: number;
  peak_irradiance_mWm2: number;
}

export interface IrradianceReport {
  fixture_model: string;
  vertical_height_m: number;
  horizontal_distance_m: number;
  throw_distance_m: number;
  vertical_height_ft: number;
  horizontal_distance_ft: number;
  throw_distance_ft: number;
  beam_diameter_h_m: number;
  beam_diameter_v_m: number;
  beam_diameter_h_ft: number;
  beam_diameter_v_ft: number;
  beam_area_m2: number;
  beam_area_ft2: number;
  field_diameter_h_m?: number;
  field_diameter_v_m?: number;
  field_diameter_h_ft?: number;
  field_diameter_v_ft?: number;
  field_area_m2?: number;
  field_area_ft2?: number;
  irradiance_mWm2: number;
  irradiance_uWcm2: number;
  irradiance_Wm2: number;
  irradiance_mWcm2: number;
  irradiance_degradation_percent: number;
}

export interface BeamCalculators {
  throw_distance_required_m: number;
  beam_angle_h_deg: number;
  beam_angle_v_deg: number;
  multiplying_factor: number;
  beam_spread_m: number;
  beam_area_m2: number;
  rectangular_volume_m3: number;
}

export interface CalculationResult {
  irradiance_report: IrradianceReport;
  beam_calculators: BeamCalculators;
}

export interface CalculationError {
  error: string;
}

export type CalculationResponse = CalculationResult | CalculationError;

export type SafetyLevel = 'safe' | 'caution' | 'warning' | 'danger';

export const SAFETY_THRESHOLDS = {
  danger: 25000,
  warning: 10000,
  caution: 2500,
} as const;

export const SAFETY_LABELS: Record<SafetyLevel, string> = {
  safe: 'SAFE — Normal operation (0-2500 mW/m2)',
  caution: 'CAUTION — Limit exposure to 5 min (2501-10000 mW/m2)',
  warning: 'WARNING — Max 1 min, full PPE required (10001-25000 mW/m2)',
  danger: 'DANGER — Immediate evacuation required (>25000 mW/m2)',
};
