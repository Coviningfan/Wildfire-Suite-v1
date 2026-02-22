import { FixtureData, CalculationResponse } from '@/types/lighting';

const FIXTURE_DATA: Record<string, FixtureData> = {
  "VSP-120F": { beam_h_deg: 33.8, beam_v_deg: 34.2, field_h_deg: 62.3, field_v_deg: 62.4, peak_irradiance_mWm2: 13250.0 },
  "VSP-120S": { beam_h_deg: 10.0, beam_v_deg: 10.0, peak_irradiance_mWm2: 24000.0 },
  "VSP-120WS": { beam_h_deg: 24.0, beam_v_deg: 24.0, peak_irradiance_mWm2: 15250.0 },
  "VSP-60S": { beam_h_deg: 10.0, beam_v_deg: 10.0, peak_irradiance_mWm2: 12480.0 },
  "VSP-60WS": { beam_h_deg: 24.0, beam_v_deg: 24.0, peak_irradiance_mWm2: 8040.0 },
  "VSP-60F": { beam_h_deg: 33.8, beam_v_deg: 34.2, field_h_deg: 62.3, field_v_deg: 62.4, peak_irradiance_mWm2: 6500.0 },
  "EM-44L": { beam_h_deg: 160.0, beam_v_deg: 160.0, peak_irradiance_mWm2: 1160.0 },
  "EM-42L": { beam_h_deg: 160.0, beam_v_deg: 160.0, peak_irradiance_mWm2: 580.0 },
  "EM-22L": { beam_h_deg: 160.0, beam_v_deg: 160.0, peak_irradiance_mWm2: 400.0 },
  "EM-44V": { beam_h_deg: 165.0, beam_v_deg: 165.0, peak_irradiance_mWm2: 1980.0 },
  "EM-43E": { beam_h_deg: 165.0, beam_v_deg: 165.0, peak_irradiance_mWm2: 1271.0 },
  "EM-42E": { beam_h_deg: 165.0, beam_v_deg: 165.0, peak_irradiance_mWm2: 912.0 },
  "UB-44": { beam_h_deg: 120.0, beam_v_deg: 120.0, peak_irradiance_mWm2: 1160.0 },
  "UB-42": { beam_h_deg: 120.0, beam_v_deg: 120.0, peak_irradiance_mWm2: 1060.0 },
  "UB-41": { beam_h_deg: 160.0, beam_v_deg: 160.0, peak_irradiance_mWm2: 290.0 },
  "UB-21": { beam_h_deg: 160.0, beam_v_deg: 160.0, peak_irradiance_mWm2: 200.0 },
  "UR-46": { beam_h_deg: 165.0, beam_v_deg: 165.0, peak_irradiance_mWm2: 114.0 },
  "UR-22": { beam_h_deg: 165.0, beam_v_deg: 165.0, peak_irradiance_mWm2: 126.3 },
  "UR-12": { beam_h_deg: 165.0, beam_v_deg: 165.0, peak_irradiance_mWm2: 83.2 },
  "L15T8/BLB": { beam_h_deg: 120.0, beam_v_deg: 120.0, peak_irradiance_mWm2: 530.0 },
  "L9T8/BLB": { beam_h_deg: 120.0, beam_v_deg: 120.0, peak_irradiance_mWm2: 378.0 },
  "L30T9/BLB": { beam_h_deg: 120.0, beam_v_deg: 120.0, peak_irradiance_mWm2: 680.0 },
  "L15T9/BLB": { beam_h_deg: 120.0, beam_v_deg: 120.0, peak_irradiance_mWm2: 320.0 },
};

export class LightingCalculator {
  private degToRad(deg: number): number {
    return deg * Math.PI / 180;
  }

  private areaCircle(diameter: number): number {
    return Math.PI * (diameter / 2) ** 2;
  }

  public static getFixtureModels(): string[] {
    return Object.keys(FIXTURE_DATA);
  }

  public static getFixtureData(model: string): FixtureData | undefined {
    return FIXTURE_DATA[model];
  }

  public calculateRadiometricData(
    fixtureModel: string,
    verticalHeight: number,
    horizontalDistance: number,
    beamWidth: number = 12.0,
    beamHeight: number = 12.0,
    rectHeight: number = 3.0,
    rectWidth: number = 3.0,
    rectDepth: number = 3.0
  ): CalculationResponse {
    if (!(fixtureModel in FIXTURE_DATA)) {
      return { error: "Invalid fixture model." };
    }
    if (verticalHeight < 0 || horizontalDistance < 0) {
      return { error: "Height and horizontal distance must be non-negative." };
    }
    const throwDistance = Math.sqrt(verticalHeight ** 2 + horizontalDistance ** 2);
    if (throwDistance === 0) {
      return { error: "Throw distance cannot be zero." };
    }

    const fixture = FIXTURE_DATA[fixtureModel];
    const beamDiaH = 2 * throwDistance * Math.tan(this.degToRad(fixture.beam_h_deg / 2));
    const beamDiaV = 2 * throwDistance * Math.tan(this.degToRad(fixture.beam_v_deg / 2));
    const beamAreaM2 = this.areaCircle(beamDiaH);

    let fieldDiaH: number | undefined;
    let fieldDiaV: number | undefined;
    let fieldAreaM2: number | undefined;

    if (fixture.field_h_deg && fixture.field_v_deg) {
      fieldDiaH = 2 * throwDistance * Math.tan(this.degToRad(fixture.field_h_deg / 2));
      fieldDiaV = 2 * throwDistance * Math.tan(this.degToRad(fixture.field_v_deg / 2));
      fieldAreaM2 = this.areaCircle(fieldDiaH);
    }

    const irradianceMWm2 = fixture.peak_irradiance_mWm2 / (throwDistance ** 2);

    const irradianceReport = {
      fixture_model: fixtureModel,
      vertical_height_m: verticalHeight,
      horizontal_distance_m: horizontalDistance,
      throw_distance_m: throwDistance,
      vertical_height_ft: verticalHeight * 3.28084,
      horizontal_distance_ft: horizontalDistance * 3.28084,
      throw_distance_ft: throwDistance * 3.28084,
      beam_diameter_h_m: beamDiaH,
      beam_diameter_v_m: beamDiaV,
      beam_diameter_h_ft: beamDiaH * 3.28084,
      beam_diameter_v_ft: beamDiaV * 3.28084,
      beam_area_m2: beamAreaM2,
      beam_area_ft2: beamAreaM2 * 10.7639,
      ...(fieldDiaH && fieldDiaV && fieldAreaM2 && {
        field_diameter_h_m: fieldDiaH,
        field_diameter_v_m: fieldDiaV,
        field_diameter_h_ft: fieldDiaH * 3.28084,
        field_diameter_v_ft: fieldDiaV * 3.28084,
        field_area_m2: fieldAreaM2,
        field_area_ft2: fieldAreaM2 * 10.7639,
      }),
      irradiance_mWm2: irradianceMWm2,
      irradiance_uWcm2: irradianceMWm2 / 10,
      irradiance_Wm2: irradianceMWm2 / 1000,
      irradiance_mWcm2: irradianceMWm2 / 10000,
      irradiance_degradation_percent: (1 - irradianceMWm2 / fixture.peak_irradiance_mWm2) * 100,
    };

    const beamCalculators = {
      throw_distance_required_m: throwDistance,
      beam_angle_h_deg: 2 * (Math.atan(beamWidth / (2 * throwDistance)) * 180 / Math.PI),
      beam_angle_v_deg: 2 * (Math.atan(beamHeight / (2 * throwDistance)) * 180 / Math.PI),
      multiplying_factor: Math.tan(this.degToRad(fixture.beam_h_deg / 2)),
      beam_spread_m: beamDiaH,
      beam_area_m2: beamAreaM2,
      rectangular_volume_m3: rectHeight * rectWidth * rectDepth,
    };

    return {
      irradiance_report: irradianceReport,
      beam_calculators: beamCalculators,
    };
  }
}
