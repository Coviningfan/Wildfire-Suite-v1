import { SAFETY_THRESHOLDS } from '@/types/lighting';
import {
  FixtureBeamData,
  HeatmapCell,
  HeatmapStats,
  SurfaceStatsData,
  SurfaceMode,
  GRID_SIZE,
  getMaterialReflectance,
} from './types';

export function computeIrradianceAtPoint(
  worldX: number,
  worldY: number,
  worldZ: number,
  beams: FixtureBeamData[],
  calibrationFactor: number,
): number {
  let totalIrr = 0;

  for (let i = 0; i < beams.length; i++) {
    const beam = beams[i];
    const tiltRad = beam.tiltAngle * (Math.PI / 180);

    const dx = worldX - beam.xPos;
    const dz = worldZ - beam.zPos;
    const dy = worldY - beam.verticalHeight;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < 0.0001) continue;

    const distance3D = Math.sqrt(distSq);
    const invDist = 1 / distance3D;

    const aimDirX = Math.sin(tiltRad);
    const aimDirY = -Math.cos(tiltRad);

    const toDirX = dx * invDist;
    const toDirY = dy * invDist;
    const toDirZ = dz * invDist;

    const dotProduct = aimDirX * toDirX + aimDirY * toDirY;
    const coneAngle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

    const halfConeH = (beam.beamHDeg / 2) * (Math.PI / 180);
    const halfConeV = (beam.beamVDeg / 2) * (Math.PI / 180);
    const halfConeAvg = (halfConeH + halfConeV) / 2;

    if (coneAngle <= halfConeAvg) {
      const falloff = Math.cos((coneAngle * Math.PI) / (2 * halfConeAvg));
      totalIrr += (beam.peakIrradiance * calibrationFactor * falloff) / distSq;
    }
  }

  return totalIrr;
}

function getSurfaceWorldCoords(
  ix: number,
  iz: number,
  gridSize: number,
  mode: SurfaceMode,
  roomWidth: number,
  roomDepth: number,
  roomHeight: number,
): [number, number, number] {
  const fx = (ix + 0.5) / gridSize;
  const fz = (iz + 0.5) / gridSize;

  switch (mode) {
    case 'floor':
      return [fx * roomWidth, 0, fz * roomDepth];
    case 'ceiling':
      return [fx * roomWidth, roomHeight, fz * roomDepth];
    case 'backWall':
      return [fx * roomWidth, fz * roomHeight, 0];
    case 'leftWall':
      return [0, fz * roomHeight, fx * roomDepth];
    case 'rightWall':
      return [roomWidth, fz * roomHeight, fx * roomDepth];
  }
}

export function generateHeatmapData(
  surfaceMode: SurfaceMode,
  roomWidth: number,
  roomDepth: number,
  roomHeight: number,
  beams: FixtureBeamData[],
  calibrationFactor: number,
  showReflections: boolean,
  floorMaterial: string,
  ceilingMaterial: string,
  wallMaterial: string,
): HeatmapCell[] {
  if (roomWidth <= 0 || roomDepth <= 0 || roomHeight <= 0) return [];

  const cells: HeatmapCell[] = new Array(GRID_SIZE * GRID_SIZE);

  const floorRefl = showReflections ? getMaterialReflectance(floorMaterial) : 0;
  const ceilRefl = showReflections ? getMaterialReflectance(ceilingMaterial) : 0;
  const wallRefl = showReflections ? getMaterialReflectance(wallMaterial) : 0;

  for (let ix = 0; ix < GRID_SIZE; ix++) {
    for (let iz = 0; iz < GRID_SIZE; iz++) {
      const [worldX, worldY, worldZ] = getSurfaceWorldCoords(
        ix, iz, GRID_SIZE, surfaceMode, roomWidth, roomDepth, roomHeight,
      );

      let directIrr = computeIrradianceAtPoint(worldX, worldY, worldZ, beams, calibrationFactor);

      if (showReflections && directIrr > 0) {
        let reflectedBoost = 0;
        if (surfaceMode === 'floor') {
          const ceilIrr = computeIrradianceAtPoint(worldX, roomHeight, worldZ, beams, calibrationFactor);
          reflectedBoost += ceilIrr * ceilRefl * 0.3;
          const wallAvgIrr = (
            computeIrradianceAtPoint(0, worldY + roomHeight * 0.5, worldZ, beams, calibrationFactor) +
            computeIrradianceAtPoint(roomWidth, worldY + roomHeight * 0.5, worldZ, beams, calibrationFactor)
          ) / 2;
          reflectedBoost += wallAvgIrr * wallRefl * 0.15;
        } else if (surfaceMode === 'ceiling') {
          const floorIrr = computeIrradianceAtPoint(worldX, 0, worldZ, beams, calibrationFactor);
          reflectedBoost += floorIrr * floorRefl * 0.3;
        } else {
          const floorIrr = computeIrradianceAtPoint(worldX, 0, worldZ, beams, calibrationFactor);
          reflectedBoost += floorIrr * floorRefl * 0.15;
          const ceilIrr = computeIrradianceAtPoint(worldX, roomHeight, worldZ, beams, calibrationFactor);
          reflectedBoost += ceilIrr * ceilRefl * 0.15;
        }
        directIrr += reflectedBoost;
      }

      cells[ix * GRID_SIZE + iz] = { x: worldX, y: worldY, z: worldZ, totalIrr: directIrr };
    }
  }

  return cells;
}

export function computeHeatmapStats(heatmapData: HeatmapCell[]): HeatmapStats {
  if (heatmapData.length === 0) return { min: 0, max: 0, avg: 0, coverage: 0 };

  let minVal = Infinity;
  let maxVal = -Infinity;
  let sum = 0;
  let coveredCount = 0;

  for (let i = 0; i < heatmapData.length; i++) {
    const irr = heatmapData[i].totalIrr;
    if (irr < minVal) minVal = irr;
    if (irr > maxVal) maxVal = irr;
    sum += irr;
    if (irr >= SAFETY_THRESHOLDS.caution) coveredCount++;
  }

  return {
    min: Math.round(minVal),
    max: Math.round(maxVal),
    avg: Math.round(sum / heatmapData.length),
    coverage: Math.round((coveredCount / heatmapData.length) * 100),
  };
}

const EXPORT_SAMPLE_SIZE = 10;

export function computeAllSurfaceStats(
  roomWidth: number,
  roomDepth: number,
  roomHeight: number,
  beams: FixtureBeamData[],
  calibrationFactor: number,
): SurfaceStatsData[] {
  if (roomWidth <= 0 || roomDepth <= 0 || roomHeight <= 0 || beams.length === 0) return [];

  const surfaces: { mode: SurfaceMode; label: string }[] = [
    { mode: 'floor', label: 'Floor' },
    { mode: 'ceiling', label: 'Ceiling' },
    { mode: 'backWall', label: 'Back Wall' },
    { mode: 'leftWall', label: 'Left Wall' },
    { mode: 'rightWall', label: 'Right Wall' },
  ];

  return surfaces.map(({ mode, label }) => {
    let minIrr = Infinity;
    let maxIrr = -Infinity;
    let sum = 0;
    let coveredCount = 0;
    const total = EXPORT_SAMPLE_SIZE * EXPORT_SAMPLE_SIZE;

    for (let ix = 0; ix < EXPORT_SAMPLE_SIZE; ix++) {
      for (let iz = 0; iz < EXPORT_SAMPLE_SIZE; iz++) {
        const [wx, wy, wz] = getSurfaceWorldCoords(
          ix, iz, EXPORT_SAMPLE_SIZE, mode, roomWidth, roomDepth, roomHeight,
        );
        const irr = computeIrradianceAtPoint(wx, wy, wz, beams, calibrationFactor);
        if (irr < minIrr) minIrr = irr;
        if (irr > maxIrr) maxIrr = irr;
        sum += irr;
        if (irr >= SAFETY_THRESHOLDS.caution) coveredCount++;
      }
    }

    return {
      surface: label,
      minIrr,
      maxIrr,
      avgIrr: sum / total,
      coverage: Math.round((coveredCount / total) * 100),
      cellCount: total,
    };
  });
}
