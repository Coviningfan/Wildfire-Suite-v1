export { TopView } from './TopView';
export { SideView } from './SideView';
export { IsometricView } from './IsometricView';
export { StatsBar, DoseBar } from './StatsBar';
export { renderAxisLabels } from './AxisLabels';
export { computeIrradianceAtPoint, generateHeatmapData, computeHeatmapStats, computeAllSurfaceStats } from './irradiance';
export type {
  SimFixture,
  PersonMarker,
  SurfaceMode,
  RoomSimulationProps,
  FixtureBeamData,
  HeatmapCell,
  SurfaceStatsData,
  HeatmapStats,
} from './types';
export {
  SVG_PADDING,
  FIXTURE_COLORS,
  GRID_SIZE,
  HEATMAP_GRADIENT,
  interpolateGradient,
  getSafetyColor,
  getSafetyLabel,
  computeDoseMJcm2,
  getDoseColor,
  getMaterialReflectance,
} from './types';
