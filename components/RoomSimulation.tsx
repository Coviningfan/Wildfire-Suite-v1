import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder, Platform } from 'react-native';
import Svg, { Rect, Ellipse, Line, Defs, RadialGradient, Stop, G, Circle, Text as SvgText } from 'react-native-svg';
import { Eye, Layers, RefreshCw, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { LightingCalculator } from '@/utils/lighting-calculator';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SVG_PADDING = 28;
const FIXTURE_COLORS = ['#E8412A', '#3B9FE8', '#22C55E', '#F5A623', '#7C6BF0', '#F97316'];
const GRID_SIZE = 10;

interface SimFixture {
  id: string;
  fixture: string;
  verticalHeight: string;
  horizontalDistance: string;
  beamWidth?: string;
  beamHeight?: string;
  xPos?: number;
  zPos?: number;
}

export interface PersonMarker {
  id: string;
  label: string;
  x: number;
  z: number;
  heightM: number;
  dwellMinutes: number;
}

type SurfaceMode = 'floor' | 'leftWall' | 'rightWall' | 'backWall' | 'ceiling';

interface RoomSimulationProps {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  fixtures: SimFixture[];
  unitLabel: string;
  onPositionsChange?: (updatedFixtures: SimFixture[]) => void;
  /** Optional external selection id controlled by the parent UI. */
  selectedFixtureId?: string;
  /** Fired when the user taps or starts dragging a fixture circle. */
  onFixtureTap?: (fixtureId: string) => void;
  /** Calibration factor applied to simulated irradiance (1.0 = raw math). */
  calibrationFactor?: number;
  /** Optional markers for people / operators used for dose readouts. */
  people?: PersonMarker[];
}

interface FixtureBeamData {
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
}

interface HeatmapCell {
  x: number;
  y: number;
  z: number;
  totalIrr: number;
}

function getSafetyColor(irradiance: number): string {
  if (irradiance > 25000) return '#EF4444';
  if (irradiance > 10000) return '#F97316';
  if (irradiance > 2500) return '#F5A623';
  return '#22C55E';
}

function getSafetyLabel(irradiance: number): string {
  if (irradiance > 25000) return 'DANGER';
  if (irradiance > 10000) return 'WARNING';
  if (irradiance > 2500) return 'CAUTION';
  return 'SAFE';
}

function computeDoseMJcm2(irradiance_mWm2: number, minutes: number): number {
  // mW/m² → W/m², then J/m² over time, then mJ/cm²
  const wattsPerM2 = irradiance_mWm2 / 1000;
  const seconds = minutes * 60;
  const joulesPerM2 = wattsPerM2 * seconds;
  const mJPerCm2 = (joulesPerM2 / 10); // 1 J/m² = 0.1 mJ/cm²
  return mJPerCm2;
}

const RoomSimulation = React.memo(
  ({
    roomWidth,
    roomDepth,
    roomHeight,
    fixtures,
    unitLabel,
    onPositionsChange,
    selectedFixtureId,
    onFixtureTap,
    calibrationFactor = 1,
    people = [],
  }: RoomSimulationProps) => {
    const colors = useThemeColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const calc = useMemo(() => new LightingCalculator(), []);

    const [viewMode, setViewMode] = useState<'top' | 'side' | 'iso'>('top');
    const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('floor');
    const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
    const [selectedFixtureInternal, setSelectedFixtureInternal] = useState<string | null>(null);
    const [fixturePositions, setFixturePositions] = useState<Record<string, { x: number; z: number }>>({});

    const svgWidth = SCREEN_WIDTH - 32;
    const svgHeight = viewMode === 'top' ? svgWidth * 0.8 : (viewMode === 'iso' ? svgWidth * 0.72 : svgWidth * 0.6);
    const drawWidth = svgWidth - SVG_PADDING * 2;
    const drawHeight = svgHeight - SVG_PADDING * 2;

    useEffect(() => {
      const pendingPositions: Record<string, { x: number; z: number }> = {};
      fixtures.forEach((fixture, index) => {
        if (!fixturePositions[fixture.id]) {
          const spacing = roomWidth > 0 ? roomWidth / (fixtures.length + 1) : 0;
          pendingPositions[fixture.id] = {
            x: fixture.xPos ?? spacing * (index + 1),
            z: fixture.zPos ?? roomDepth / 2,
          };
        }
      });

      if (Object.keys(pendingPositions).length > 0) {
        setFixturePositions((previous) => ({ ...previous, ...pendingPositions }));
      }
    }, [fixtures, roomWidth, roomDepth, fixturePositions]);

    const beamData = useMemo<FixtureBeamData[]>(() => {
      if (roomWidth <= 0 || roomDepth <= 0) return [];

      const values = fixtures
        .map((fixture, index) => {
          if (!fixture.fixture) return null;

          const verticalHeight = parseFloat(fixture.verticalHeight) || roomHeight;
          const horizontalDistance = parseFloat(fixture.horizontalDistance) || 0;
          const result = calc.calculateRadiometricData(fixture.fixture, verticalHeight, horizontalDistance);

          if ('error' in result || !result.irradiance_report) {
            return null;
          }

          const report = result.irradiance_report;
          const basePosition = fixturePositions[fixture.id] ?? {
            x: fixture.xPos ?? roomWidth / 2,
            z: fixture.zPos ?? roomDepth / 2,
          };

          const clampedX = Math.max(report.beam_diameter_h_m / 2, Math.min(basePosition.x, roomWidth - report.beam_diameter_h_m / 2));
          const clampedZ = Math.max(report.beam_diameter_v_m / 2, Math.min(basePosition.z, roomDepth - report.beam_diameter_v_m / 2));

          const calibratedIrr = report.irradiance_mWm2 * calibrationFactor;

          return {
            id: fixture.id,
            model: fixture.fixture,
            color: FIXTURE_COLORS[index % FIXTURE_COLORS.length],
            throwDistance: report.throw_distance_m,
            beamDiamH: Math.min(report.beam_diameter_h_m, roomWidth),
            beamDiamV: Math.min(report.beam_diameter_v_m, roomDepth),
            irradiance: calibratedIrr,
            safetyLevel: getSafetyLabel(calibratedIrr),
            verticalHeight,
            horizontalDistance,
            xPos: clampedX,
            zPos: clampedZ,
          };
        })
        .filter(Boolean) as FixtureBeamData[];

      return values;
    }, [fixtures, fixturePositions, roomWidth, roomDepth, roomHeight, calc, calibrationFactor]);

    const sampleSurfaceCells = useCallback((): HeatmapCell[] => {
      if (!showHeatmap || roomWidth <= 0 || roomDepth <= 0 || roomHeight <= 0) return [];
      const cells: HeatmapCell[] = [];
      for (let ix = 0; ix < GRID_SIZE; ix += 1) {
        for (let iz = 0; iz < GRID_SIZE; iz += 1) {
          let worldX = 0;
          let worldY = 0;
          let worldZ = 0;

          if (surfaceMode === 'floor') {
            worldX = ((ix + 0.5) / GRID_SIZE) * roomWidth;
            worldZ = ((iz + 0.5) / GRID_SIZE) * roomDepth;
            worldY = 0;
          } else if (surfaceMode === 'ceiling') {
            worldX = ((ix + 0.5) / GRID_SIZE) * roomWidth;
            worldZ = ((iz + 0.5) / GRID_SIZE) * roomDepth;
            worldY = roomHeight;
          } else if (surfaceMode === 'backWall') {
            worldX = ((ix + 0.5) / GRID_SIZE) * roomWidth;
            worldY = ((iz + 0.5) / GRID_SIZE) * roomHeight;
            worldZ = 0;
          } else if (surfaceMode === 'leftWall') {
            worldZ = ((ix + 0.5) / GRID_SIZE) * roomDepth;
            worldY = ((iz + 0.5) / GRID_SIZE) * roomHeight;
            worldX = 0;
          } else {
            // rightWall
            worldZ = ((ix + 0.5) / GRID_SIZE) * roomDepth;
            worldY = ((iz + 0.5) / GRID_SIZE) * roomHeight;
            worldX = roomWidth;
          }

          let totalIrr = 0;
          beamData.forEach((beam) => {
            const fixtureData = LightingCalculator.getFixtureData(beam.model);
            if (!fixtureData) return;

            const dx = worldX - beam.xPos;
            const dz = worldZ - beam.zPos;
            const dy = worldY - beam.verticalHeight;
            const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance3D > 0.01) {
              totalIrr += fixtureData.peak_irradiance_mWm2 * calibrationFactor / (distance3D * distance3D);
            }
          });

          cells.push({ x: worldX, y: worldY, z: worldZ, totalIrr });
        }
      }
      return cells;
    }, [beamData, calibrationFactor, roomDepth, roomHeight, roomWidth, showHeatmap, surfaceMode]);

    const heatmapData = useMemo<HeatmapCell[]>(() => sampleSurfaceCells(), [sampleSurfaceCells]);

    const toSvgX = useCallback((worldX: number): number => SVG_PADDING + (worldX / roomWidth) * drawWidth, [roomWidth, drawWidth]);
    const toSvgZ = useCallback((worldZ: number): number => SVG_PADDING + (worldZ / roomDepth) * drawHeight, [roomDepth, drawHeight]);
    const toSvgY = useCallback((worldY: number): number => SVG_PADDING + ((roomHeight - worldY) / roomHeight) * drawHeight, [roomHeight, drawHeight]);
    const scaleX = useCallback((distance: number): number => (distance / roomWidth) * drawWidth, [roomWidth, drawWidth]);

    const createPanResponder = (fixtureId: string) => {
      let startX = 0;
      let startZ = 0;

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const beam = beamData.find((entry) => entry.id === fixtureId);
          if (beam) {
            startX = beam.xPos;
            startZ = beam.zPos;
          }
          setSelectedFixtureInternal(fixtureId);
          if (onFixtureTap) {
            onFixtureTap(fixtureId);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          const beam = beamData.find((entry) => entry.id === fixtureId);
          if (!beam || drawWidth <= 0 || drawHeight <= 0) return;

          const movedX = startX + (gestureState.dx / drawWidth) * roomWidth;
          const movedZ = startZ + (gestureState.dy / drawHeight) * roomDepth;

          const nextX = Math.max(beam.beamDiamH / 2, Math.min(movedX, roomWidth - beam.beamDiamH / 2));
          const nextZ = Math.max(beam.beamDiamV / 2, Math.min(movedZ, roomDepth - beam.beamDiamV / 2));

          setFixturePositions((previous) => ({ ...previous, [fixtureId]: { x: nextX, z: nextZ } }));

          if (onPositionsChange) {
            const updatedFixtures = fixtures.map((fixture) => (
              fixture.id === fixtureId ? { ...fixture, xPos: nextX, zPos: nextZ } : fixture
            ));
            onPositionsChange(updatedFixtures);
          }
        },
        onPanResponderRelease: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      });
    };

    const toggleView = useCallback(() => {
      Haptics.selectionAsync();
      setViewMode((previous) => {
        if (previous === 'top') return 'side';
        if (previous === 'side') return 'iso';
        return 'top';
      });
    }, []);

    const toggleHeatmap = useCallback(() => {
      Haptics.selectionAsync();
      setShowHeatmap((previous) => !previous);
    }, []);

    const resetPositions = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setFixturePositions({});
    }, []);

    const handleSurfaceModeChange = useCallback((mode: SurfaceMode) => {
      Haptics.selectionAsync();
      setSurfaceMode(mode);
      if (viewMode !== 'top') {
        setViewMode('top');
      }
    }, [viewMode]);

    const hasData = beamData.length > 0 && roomWidth > 0 && roomDepth > 0;

    const stats = useMemo(() => {
      if (!hasData) {
        return { maxIrr: 0, avgIrr: 0, safety: 'SAFE', coverage: 0 };
      }

      const irradiances = beamData.map((entry) => entry.irradiance);
      const maxIrr = Math.max(...irradiances);
      const avgIrr = irradiances.reduce((sum, current) => sum + current, 0) / irradiances.length;
      const coverage = heatmapData.length
        ? Math.min(
            98,
            Math.round(
              (heatmapData.filter((cell) => cell.totalIrr >= 2500).length / heatmapData.length) * 100,
            ),
          )
        : 0;

      return {
        maxIrr: Math.round(maxIrr),
        avgIrr: Math.round(avgIrr),
        safety: getSafetyLabel(maxIrr),
        coverage,
      };
    }, [beamData, hasData, heatmapData]);

    const activeSelectionId = selectedFixtureId ?? selectedFixtureInternal;

    const renderTopView = () => {
      const isHorizontalSurface = surfaceMode === 'floor' || surfaceMode === 'ceiling';
      const isSideWall = surfaceMode === 'leftWall' || surfaceMode === 'rightWall';
      const spanX = isHorizontalSurface ? roomWidth : (isSideWall ? roomDepth : roomWidth);
      const spanY = isHorizontalSurface ? roomDepth : roomHeight;

      const projectSurfacePoint = (point: { x: number; y: number; z: number }) => {
        const worldSurfaceX = isHorizontalSurface ? point.x : (isSideWall ? point.z : point.x);
        const worldSurfaceY = isHorizontalSurface ? point.z : point.y;

        return {
          x: SVG_PADDING + (worldSurfaceX / spanX) * drawWidth,
          y: SVG_PADDING + ((spanY - worldSurfaceY) / spanY) * drawHeight,
        };
      };

      const heatmapRects = showHeatmap ? heatmapData.map((cell, index) => {
        const center = projectSurfacePoint(cell);
        const cellWidth = drawWidth / GRID_SIZE;
        const cellHeight = drawHeight / GRID_SIZE;

        return (
          <Rect
            key={`heat-${index}`}
            x={center.x - cellWidth / 2}
            y={center.y - cellHeight / 2}
            width={cellWidth}
            height={cellHeight}
            fill={getSafetyColor(cell.totalIrr)}
            opacity={Math.min(0.65, cell.totalIrr / 35000)}
          />
        );
      }) : null;

      const beamEllipses = beamData.map((beam, index) => {
        const sourcePoint = {
          x: beam.xPos,
          z: beam.zPos,
          y: isHorizontalSurface
            ? (surfaceMode === 'ceiling' ? roomHeight : 0)
            : Math.min(roomHeight, Math.max(0, beam.verticalHeight)),
        };
        const center = projectSurfacePoint(sourcePoint);
        const beamWidthWorld = isSideWall ? beam.beamDiamV : beam.beamDiamH;
        const beamHeightWorld = isHorizontalSurface ? beam.beamDiamV : Math.min(roomHeight, Math.max(0.8, beam.beamDiamV));
        const radiusX = Math.max((beamWidthWorld / spanX) * drawWidth / 2, 8);
        const radiusY = Math.max((beamHeightWorld / spanY) * drawHeight / 2, 8);
        const isSelected = activeSelectionId === beam.id;

        return (
          <G key={`beam-${beam.id}`}>
            <Ellipse cx={center.x} cy={center.y} rx={radiusX} ry={radiusY} fill={`url(#beam-grad-${index})`} opacity={isSelected ? 0.82 : 0.5} />
            <Ellipse cx={center.x} cy={center.y} rx={radiusX} ry={radiusY} fill="none" stroke={beam.color} strokeWidth={isSelected ? 2 : 1.5} strokeDasharray="4,3" />
          </G>
        );
      });

      const fixtureMarkers = beamData.map((beam) => {
        const center = projectSurfacePoint({
          x: beam.xPos,
          z: beam.zPos,
          y: isHorizontalSurface
            ? (surfaceMode === 'ceiling' ? roomHeight : 0)
            : Math.min(roomHeight, Math.max(0, beam.verticalHeight)),
        });
        const panResponder = createPanResponder(beam.id);
        const panHandlers = Platform.OS === 'web' || !isHorizontalSurface ? {} : panResponder.panHandlers;
        const isSelected = activeSelectionId === beam.id;

        return (
          <G key={`fixture-${beam.id}`} {...panHandlers}>
            <Circle cx={center.x} cy={center.y} r={isSelected ? 11 : 9} fill={colors.surface} stroke={beam.color} strokeWidth={3} />
            <Circle cx={center.x} cy={center.y} r={4} fill={beam.color} />
            <SvgText x={center.x} y={center.y - 18} textAnchor="middle" fontSize="9" fontWeight="700" fill={beam.color}>
              {beam.model}
            </SvgText>
          </G>
        );
      });

      return (
        <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <Defs>
            {beamData.map((beam, index) => (
              <RadialGradient key={`grad-${beam.id}`} id={`beam-grad-${index}`} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={beam.color} stopOpacity="0.55" />
                <Stop offset="45%" stopColor={beam.color} stopOpacity="0.28" />
                <Stop offset="80%" stopColor={beam.color} stopOpacity="0.08" />
                <Stop offset="100%" stopColor={beam.color} stopOpacity="0" />
              </RadialGradient>
            ))}
          </Defs>

          <Rect x={SVG_PADDING} y={SVG_PADDING} width={drawWidth} height={drawHeight} fill={colors.surfaceSecondary} stroke={colors.border} strokeWidth={2} rx={6} />

          {[0.25, 0.5, 0.75].map((fraction) => (
            <G key={`grid-${fraction}`}>
              <Line x1={SVG_PADDING} y1={SVG_PADDING + drawHeight * fraction} x2={SVG_PADDING + drawWidth} y2={SVG_PADDING + drawHeight * fraction} stroke={colors.border} strokeWidth={0.75} strokeDasharray="5,3" />
              <Line x1={SVG_PADDING + drawWidth * fraction} y1={SVG_PADDING} x2={SVG_PADDING + drawWidth * fraction} y2={SVG_PADDING + drawHeight} stroke={colors.border} strokeWidth={0.75} strokeDasharray="5,3" />
            </G>
          ))}

          {heatmapRects}

          {beamEllipses}

          {fixtureMarkers}

          {!isHorizontalSurface && (
            <SvgText x={SVG_PADDING + 8} y={SVG_PADDING + 14} fontSize="9" fontWeight="700" fill={colors.textSecondary}>
              Elevation View ({surfaceMode === 'backWall' ? 'Back Wall' : surfaceMode === 'leftWall' ? 'Left Wall' : 'Right Wall'})
            </SvgText>
          )}

          <SvgText x={svgWidth / 2} y={svgHeight - 4} textAnchor="middle" fontSize="9" fill={colors.textTertiary}>
            {isHorizontalSurface
              ? `${roomWidth.toFixed(1)} × ${roomDepth.toFixed(1)} ${unitLabel}`
              : `${spanX.toFixed(1)} ${unitLabel} width × ${roomHeight.toFixed(1)} ${unitLabel} height`}
          </SvgText>
        </Svg>
      );
    };

    const renderSideView = () => (
      <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <Defs>
          {beamData.map((beam, index) => (
            <RadialGradient key={`sgrad-${beam.id}`} id={`side-grad-${index}`} cx="50%" cy="0%" rx="50%" ry="100%">
              <Stop offset="0%" stopColor={beam.color} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={beam.color} stopOpacity="0.05" />
            </RadialGradient>
          ))}
        </Defs>

        <Rect x={SVG_PADDING} y={SVG_PADDING} width={drawWidth} height={drawHeight} fill={colors.surfaceSecondary} stroke={colors.border} strokeWidth={1.5} rx={4} />
        <Line x1={SVG_PADDING} y1={SVG_PADDING + drawHeight} x2={SVG_PADDING + drawWidth} y2={SVG_PADDING + drawHeight} stroke={colors.textTertiary} strokeWidth={2} />
        <Line x1={SVG_PADDING} y1={SVG_PADDING} x2={SVG_PADDING + drawWidth} y2={SVG_PADDING} stroke={colors.textTertiary} strokeWidth={1} strokeDasharray="6,3" opacity={0.5} />

        {beamData.map((beam, index) => {
          const fixtureX = toSvgX(beam.xPos);
          const fixtureY = SVG_PADDING + 2;
          const floorY = SVG_PADDING + drawHeight;
          const beamHalfW = Math.max(scaleX(beam.beamDiamH / 2), 8);
          const isSelected = activeSelectionId === beam.id;

          return (
            <G key={`side-${beam.id}`}>
              <Line x1={fixtureX} y1={fixtureY} x2={fixtureX - beamHalfW} y2={floorY} stroke={beam.color} strokeWidth={1} opacity={0.5} strokeDasharray="4,3" />
              <Line x1={fixtureX} y1={fixtureY} x2={fixtureX + beamHalfW} y2={floorY} stroke={beam.color} strokeWidth={1} opacity={0.5} strokeDasharray="4,3" />
              <Ellipse cx={fixtureX} cy={(fixtureY + floorY) / 2} rx={beamHalfW / 2} ry={(floorY - fixtureY) / 2} fill={`url(#side-grad-${index})`} opacity={isSelected ? 0.9 : 0.7} />
              <Line
                x1={fixtureX - beamHalfW}
                y1={floorY}
                x2={fixtureX + beamHalfW}
                y2={floorY}
                stroke={getSafetyColor(beam.irradiance)}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.8}
              />
              <Circle cx={fixtureX} cy={fixtureY + 6} r={6} fill={colors.surface} stroke={beam.color} strokeWidth={isSelected ? 2 : 1.5} />
              <Circle cx={fixtureX} cy={fixtureY + 6} r={2.5} fill={beam.color} />
            </G>
          );
        })}
      </Svg>
    );


    const renderIsometricView = () => {
      const projectIso = (x: number, y: number, z: number) => {
        const nx = roomWidth > 0 ? x / roomWidth : 0;
        const ny = roomHeight > 0 ? y / roomHeight : 0;
        const nz = roomDepth > 0 ? z / roomDepth : 0;
        const isoX = (nx - nz) * 0.5;
        const isoY = (nx + nz) * 0.28 - ny * 0.7;

        return {
          x: SVG_PADDING + drawWidth * (0.5 + isoX),
          y: SVG_PADDING + drawHeight * (0.78 + isoY),
        };
      };

      const corners = {
        floorFrontLeft: projectIso(0, 0, roomDepth),
        floorFrontRight: projectIso(roomWidth, 0, roomDepth),
        floorBackLeft: projectIso(0, 0, 0),
        floorBackRight: projectIso(roomWidth, 0, 0),
        ceilFrontLeft: projectIso(0, roomHeight, roomDepth),
        ceilFrontRight: projectIso(roomWidth, roomHeight, roomDepth),
        ceilBackLeft: projectIso(0, roomHeight, 0),
        ceilBackRight: projectIso(roomWidth, roomHeight, 0),
      };

      return (
        <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <Rect x={SVG_PADDING} y={SVG_PADDING} width={drawWidth} height={drawHeight} fill={colors.surfaceSecondary} rx={8} />

          <G opacity={0.9}>
            <Line x1={corners.floorFrontLeft.x} y1={corners.floorFrontLeft.y} x2={corners.floorFrontRight.x} y2={corners.floorFrontRight.y} stroke={colors.border} strokeWidth={1.3} />
            <Line x1={corners.floorFrontRight.x} y1={corners.floorFrontRight.y} x2={corners.floorBackRight.x} y2={corners.floorBackRight.y} stroke={colors.border} strokeWidth={1.3} />
            <Line x1={corners.floorBackRight.x} y1={corners.floorBackRight.y} x2={corners.floorBackLeft.x} y2={corners.floorBackLeft.y} stroke={colors.border} strokeWidth={1.3} />
            <Line x1={corners.floorBackLeft.x} y1={corners.floorBackLeft.y} x2={corners.floorFrontLeft.x} y2={corners.floorFrontLeft.y} stroke={colors.border} strokeWidth={1.3} />

            <Line x1={corners.ceilFrontLeft.x} y1={corners.ceilFrontLeft.y} x2={corners.ceilFrontRight.x} y2={corners.ceilFrontRight.y} stroke={colors.border} strokeWidth={1} opacity={0.8} />
            <Line x1={corners.ceilFrontRight.x} y1={corners.ceilFrontRight.y} x2={corners.ceilBackRight.x} y2={corners.ceilBackRight.y} stroke={colors.border} strokeWidth={1} opacity={0.8} />
            <Line x1={corners.ceilBackRight.x} y1={corners.ceilBackRight.y} x2={corners.ceilBackLeft.x} y2={corners.ceilBackLeft.y} stroke={colors.border} strokeWidth={1} opacity={0.8} />
            <Line x1={corners.ceilBackLeft.x} y1={corners.ceilBackLeft.y} x2={corners.ceilFrontLeft.x} y2={corners.ceilFrontLeft.y} stroke={colors.border} strokeWidth={1} opacity={0.8} />

            <Line x1={corners.floorFrontLeft.x} y1={corners.floorFrontLeft.y} x2={corners.ceilFrontLeft.x} y2={corners.ceilFrontLeft.y} stroke={colors.border} strokeWidth={1} opacity={0.7} />
            <Line x1={corners.floorFrontRight.x} y1={corners.floorFrontRight.y} x2={corners.ceilFrontRight.x} y2={corners.ceilFrontRight.y} stroke={colors.border} strokeWidth={1} opacity={0.7} />
            <Line x1={corners.floorBackLeft.x} y1={corners.floorBackLeft.y} x2={corners.ceilBackLeft.x} y2={corners.ceilBackLeft.y} stroke={colors.border} strokeWidth={1} opacity={0.7} />
            <Line x1={corners.floorBackRight.x} y1={corners.floorBackRight.y} x2={corners.ceilBackRight.x} y2={corners.ceilBackRight.y} stroke={colors.border} strokeWidth={1} opacity={0.7} />
          </G>

          {beamData.map((beam, index) => {
            const fixture = projectIso(beam.xPos, Math.min(roomHeight, beam.verticalHeight), beam.zPos);
            const floorCenter = projectIso(beam.xPos, 0, beam.zPos);
            const footprintX = Math.max((beam.beamDiamH / Math.max(roomWidth, 0.1)) * drawWidth * 0.25, 6);
            const footprintY = Math.max((beam.beamDiamV / Math.max(roomDepth, 0.1)) * drawHeight * 0.12, 5);
            const isSelected = activeSelectionId === beam.id;

            return (
              <G key={`iso-${beam.id}`}>
                <Line x1={fixture.x} y1={fixture.y} x2={floorCenter.x} y2={floorCenter.y} stroke={beam.color} strokeDasharray="4,3" strokeWidth={1.2} opacity={0.55} />
                <Ellipse cx={floorCenter.x} cy={floorCenter.y} rx={footprintX} ry={footprintY} fill={beam.color} opacity={isSelected ? 0.3 : 0.16} />
                <Circle cx={fixture.x} cy={fixture.y} r={isSelected ? 5.5 : 4.2} fill={colors.surface} stroke={beam.color} strokeWidth={2} />
                <Circle cx={fixture.x} cy={fixture.y} r={2} fill={beam.color} />
                {index < 3 && (
                  <SvgText x={fixture.x + 7} y={fixture.y - 6} fontSize="8" fill={colors.textSecondary}>
                    {beam.model}
                  </SvgText>
                )}
              </G>
            );
          })}

          <SvgText x={SVG_PADDING + 8} y={SVG_PADDING + 14} fontSize="9" fontWeight="700" fill={colors.textSecondary}>
            3D Overview · {surfaceMode === 'floor' ? 'Floor Focus' : surfaceMode === 'ceiling' ? 'Ceiling Focus' : 'Wall Focus'}
          </SvgText>
        </Svg>
      );
    };

    const peopleReadouts = useMemo(() => {
      if (!people.length || !beamData.length) return [] as { id: string; label: string; irr: number; dose: number; level: string }[];
      return people.map((p) => {
        let maxIrr = 0;
        beamData.forEach((beam) => {
          const fixtureData = LightingCalculator.getFixtureData(beam.model);
          if (!fixtureData) return;
          const dx = p.x - beam.xPos;
          const dz = p.z - beam.zPos;
          const dy = p.heightM - beam.verticalHeight;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > 0.01) {
            const irr = fixtureData.peak_irradiance_mWm2 * calibrationFactor / (dist * dist);
            if (irr > maxIrr) maxIrr = irr;
          }
        });
        const dose = computeDoseMJcm2(maxIrr, p.dwellMinutes);
        return { id: p.id, label: p.label, irr: Math.round(maxIrr), dose: Math.round(dose * 10) / 10, level: getSafetyLabel(maxIrr) };
      });
    }, [beamData, calibrationFactor, people]);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Layers size={16} color={colors.accent} />
            <Text style={styles.headerTitle}>Room Simulation</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity testID="toggle-heatmap-button" style={styles.controlBtn} onPress={toggleHeatmap}>
              <Target size={14} color={showHeatmap ? colors.accent : colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity testID="reset-positions-button" style={styles.controlBtn} onPress={resetPositions}>
              <RefreshCw size={14} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity testID="toggle-view-button" style={styles.viewToggle} onPress={toggleView}>
              <Eye size={13} color={colors.primary} />
              <Text style={styles.viewToggleText}>{viewMode === 'top' ? 'TOP' : (viewMode === 'side' ? 'SIDE' : '3D')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.surfaceTabs}>
          {(
            [
              { id: 'floor', label: 'Floor' },
              { id: 'backWall', label: 'Back Wall' },
              { id: 'leftWall', label: 'Left Wall' },
              { id: 'rightWall', label: 'Right Wall' },
              { id: 'ceiling', label: 'Ceiling' },
            ] as { id: SurfaceMode; label: string }[]
          ).map((tab) => {
            const active = surfaceMode === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.surfaceTab, active && styles.surfaceTabActive]}
                onPress={() => handleSurfaceModeChange(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.surfaceTabText, active && styles.surfaceTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <Layers size={32} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Add fixtures to begin simulation</Text>
          </View>
        ) : (
          <>
            <View style={styles.svgContainer}>{viewMode === 'top' ? renderTopView() : (viewMode === 'side' ? renderSideView() : renderIsometricView())}</View>

            <View style={styles.statsBar}>
              <Text style={styles.statsLabel}>MAX</Text>
              <Text style={[styles.statsValue, { color: getSafetyColor(stats.maxIrr) }]}>{stats.maxIrr}</Text>
              <Text style={styles.statsUnit}>mW/m²</Text>

              <Text style={styles.statsLabel}>AVG</Text>
              <Text style={styles.statsValue}>{stats.avgIrr}</Text>
              <Text style={styles.statsUnit}>mW/m²</Text>

              <Text style={styles.statsLabel}>SAFETY</Text>
              <Text style={[styles.statsValue, { color: getSafetyColor(stats.maxIrr) }]}>{stats.safety}</Text>

              <Text style={styles.statsLabel}>COVER</Text>
              <Text style={styles.statsValue}>{stats.coverage}%</Text>
            </View>

            {!!peopleReadouts.length && (
              <View style={styles.peopleRow}>
                {peopleReadouts.map((p) => (
                  <View key={p.id} style={styles.personChip}>
                    <Text style={styles.personLabel}>{p.label}</Text>
                    <Text style={[styles.personDose, { color: getSafetyColor(p.irr) }]}>
                      {p.irr} mW/m² • {p.dose} mJ/cm²
                    </Text>
                    <Text style={styles.personLevel}>{p.level}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  },
);

RoomSimulation.displayName = 'RoomSimulation';

export { RoomSimulation };

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.1,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    controlBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    viewToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.glow,
      borderWidth: 1,
      borderColor: 'rgba(232, 65, 42, 0.15)',
    },
    viewToggleText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    surfaceTabs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingBottom: 6,
      paddingTop: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    surfaceTab: {
      flex: 1,
      marginHorizontal: 2,
      paddingVertical: 4,
      borderRadius: 8,
      alignItems: 'center',
    },
    surfaceTabActive: {
      backgroundColor: colors.glow,
    },
    surfaceTabText: {
      fontSize: 10,
      color: colors.textTertiary,
      fontWeight: '600' as const,
    },
    surfaceTabTextActive: {
      color: colors.primary,
    },
    svgContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    statsBar: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceSecondary,
    },
    statsLabel: {
      fontSize: 10,
      color: colors.textTertiary,
      fontWeight: '700' as const,
    },
    statsValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '700' as const,
    },
    statsUnit: {
      fontSize: 10,
      color: colors.textTertiary,
      marginRight: 8,
    },
    peopleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 10,
      backgroundColor: colors.surfaceSecondary,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    personChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    personLabel: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: colors.text,
    },
    personDose: {
      fontSize: 11,
      fontWeight: '600' as const,
      marginTop: 2,
    },
    personLevel: {
      fontSize: 10,
      color: colors.textTertiary,
      marginTop: 2,
    },
  });
}
