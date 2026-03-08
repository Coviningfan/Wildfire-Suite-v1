import { SAFETY_THRESHOLDS, DOSE_THRESHOLDS } from '@/types/lighting';
import { SURFACE_MATERIALS } from '@/constants/materials';

export const SVG_PADDING = 36;
export const FIXTURE_COLORS = ['#E8412A', '#3B9FE8', '#22C55E', '#F5A623', '#7C6BF0', '#F97316'];
export const GRID_SIZE = 25;

export const HEATMAP_GRADIENT = [
  { stop: 0, color: [34, 197, 94] },
  { stop: 0.15, color: [34, 197, 94] },
  { stop: 0.3, color: [245, 166, 35] },
  { stop: 0.5, color: [249, 115, 22] },
  { stop: 0.75, color: [239, 68, 68] },
  { stop: 1.0, color: [185, 28, 28] },
];

export interface SimFixture {
  id: string;
  fixture: string;
  verticalHeight: string;
  horizontalDistance: string;
  beamWidth?: string;
  beamHeight?: string;
  xPos?: number;
  zPos?: number;
  tiltAngle?: number;
}

export interface PersonMarker {
  id: string;
  label: string;
  x: number;
  z: number;
  heightM: number;
  dwellMinutes: number;
}

export type SurfaceMode = 'floor' | 'leftWall' | 'rightWall' | 'backWall' | 'ceiling';

export interface RoomSimulationProps {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  fixtures: SimFixture[];
  unitLabel: string;
  onFixturePositionChange?: (fixtureId: string, xPos: number, zPos: number) => void;
  selectedFixtureId?: string;
  onFixtureTap?: (fixtureId: string) => void;
  calibrationFactor?: number;
  people?: PersonMarker[];
  exposureMinutes?: number;
  floorMaterial?: string;
  ceilingMaterial?: string;
  wallMaterial?: string;
  onSurfaceStatsChange?: (stats: SurfaceStatsData[]) => void;
}

export interface FixtureBeamData {
  id: string;
  model: string;
  color: string;
  throwDistance: number;
  beamDiamH: number;
  beamDiamV: number;
  irradiance: number;
  safetyLevel: string;
  verticalHeight: number;
  horizontalDistance: number;
  xPos: number;
  zPos: number;
  tiltAngle: number;
  beamHDeg: number;
  beamVDeg: number;
  peakIrradiance: number;
}

export interface HeatmapCell {
  x: number;
  y: number;
  z: number;
  totalIrr: number;
}

export interface SurfaceStatsData {
  surface: string;
  minIrr: number;
  maxIrr: number;
  avgIrr: number;
  coverage: number;
  cellCount: number;
}

export interface HeatmapStats {
  min: number;
  max: number;
  avg: number;
  coverage: number;
}

export function interpolateGradient(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < HEATMAP_GRADIENT.length - 1; i++) {
    const a = HEATMAP_GRADIENT[i];
    const b = HEATMAP_GRADIENT[i + 1];
    if (clamped >= a.stop && clamped <= b.stop) {
      const local = (clamped - a.stop) / (b.stop - a.stop);
      const r = Math.round(a.color[0] + (b.color[0] - a.color[0]) * local);
      const g = Math.round(a.color[1] + (b.color[1] - a.color[1]) * local);
      const bl = Math.round(a.color[2] + (b.color[2] - a.color[2]) * local);
      return `rgb(${r},${g},${bl})`;
    }
  }
  const last = HEATMAP_GRADIENT[HEATMAP_GRADIENT.length - 1];
  return `rgb(${last.color[0]},${last.color[1]},${last.color[2]})`;
}

export function getSafetyColor(irradiance: number): string {
  if (irradiance > SAFETY_THRESHOLDS.danger) return '#EF4444';
  if (irradiance > SAFETY_THRESHOLDS.warning) return '#F97316';
  if (irradiance > SAFETY_THRESHOLDS.caution) return '#F5A623';
  return '#22C55E';
}

export function getSafetyLabel(irradiance: number): string {
  if (irradiance > SAFETY_THRESHOLDS.danger) return 'DANGER';
  if (irradiance > SAFETY_THRESHOLDS.warning) return 'WARNING';
  if (irradiance > SAFETY_THRESHOLDS.caution) return 'CAUTION';
  return 'SAFE';
}

export function computeDoseMJcm2(irradiance_mWm2: number, minutes: number): number {
  const wattsPerM2 = irradiance_mWm2 / 1000;
  const seconds = minutes * 60;
  const joulesPerM2 = wattsPerM2 * seconds;
  return joulesPerM2 / 10;
}

export function getDoseColor(dose: number): string {
  if (dose > DOSE_THRESHOLDS.acgih_tlv_365nm) return '#EF4444';
  if (dose > DOSE_THRESHOLDS.warning_365nm) return '#F97316';
  if (dose > DOSE_THRESHOLDS.caution_365nm) return '#F5A623';
  return '#22C55E';
}

export function getMaterialReflectance(materialId: string): number {
  return SURFACE_MATERIALS.find((m) => m.id === materialId)?.uvReflectance ?? 0;
}
