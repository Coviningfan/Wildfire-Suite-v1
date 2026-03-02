import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import Svg, { Rect, Ellipse, Line, Defs, RadialGradient, Stop, G, Circle, Text as SvgText } from 'react-native-svg';
import { Eye, Layers, RefreshCw, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { LightingCalculator } from '@/utils/lighting-calculator';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SVG_PADDING = 28;
const FIXTURE_COLORS = ['#E8412A', '#3B9FE8', '#22C55E', '#F5A623', '#7C6BF0', '#F97316'];
const GRID_SIZE = 8;

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

interface RoomSimulationProps {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  fixtures: SimFixture[];
  unitLabel: string;
  onPositionsChange?: (updatedFixtures: SimFixture[]) => void;
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

const RoomSimulation = React.memo(
  ({ roomWidth, roomDepth, roomHeight, fixtures, unitLabel, onPositionsChange }: RoomSimulationProps) => {
    const colors = useThemeColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const calc = useMemo(() => new LightingCalculator(), []);

    const [viewMode, setViewMode] = useState<'top' | 'side'>('top');
    const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
    const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
    const [fixturePositions, setFixturePositions] = useState<Record<string, { x: number; z: number }>>({});

    const svgWidth = SCREEN_WIDTH - 32;
    const svgHeight = viewMode === 'top' ? svgWidth * 0.72 : svgWidth * 0.58;
    const drawWidth = svgWidth - SVG_PADDING * 2;
    const drawHeight = svgHeight - SVG_PADDING * 2;

    useEffect(() => {
      console.log('[RoomSimulation] fixtures changed', { count: fixtures.length, roomWidth, roomDepth });
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
            console.log('[RoomSimulation] skipping invalid fixture result', { id: fixture.id, model: fixture.fixture, error: 'error' in result ? result.error : 'unknown' });
            return null;
          }

          const report = result.irradiance_report;
          const basePosition = fixturePositions[fixture.id] ?? {
            x: fixture.xPos ?? roomWidth / 2,
            z: fixture.zPos ?? roomDepth / 2,
          };

          const clampedX = Math.max(report.beam_diameter_h_m / 2, Math.min(basePosition.x, roomWidth - report.beam_diameter_h_m / 2));
          const clampedZ = Math.max(report.beam_diameter_v_m / 2, Math.min(basePosition.z, roomDepth - report.beam_diameter_v_m / 2));

          return {
            id: fixture.id,
            model: fixture.fixture,
            color: FIXTURE_COLORS[index % FIXTURE_COLORS.length],
            throwDistance: report.throw_distance_m,
            beamDiamH: Math.min(report.beam_diameter_h_m, roomWidth),
            beamDiamV: Math.min(report.beam_diameter_v_m, roomDepth),
            irradiance: report.irradiance_mWm2,
            safetyLevel: getSafetyLabel(report.irradiance_mWm2),
            verticalHeight,
            horizontalDistance,
            xPos: clampedX,
            zPos: clampedZ,
          };
        })
        .filter(Boolean) as FixtureBeamData[];

      console.log('[RoomSimulation] beamData generated', { count: values.length });
      return values;
    }, [fixtures, fixturePositions, roomWidth, roomDepth, roomHeight, calc]);

    const heatmapData = useMemo<HeatmapCell[]>(() => {
      if (!showHeatmap || roomWidth <= 0 || roomDepth <= 0) return [];

      const cells: HeatmapCell[] = [];
      for (let i = 0; i < GRID_SIZE; i += 1) {
        for (let j = 0; j < GRID_SIZE; j += 1) {
          const worldX = ((i + 0.5) / GRID_SIZE) * roomWidth;
          const worldZ = ((j + 0.5) / GRID_SIZE) * roomDepth;

          let totalIrr = 0;
          beamData.forEach((beam) => {
            const fixtureData = LightingCalculator.getFixtureData(beam.model);
            if (!fixtureData) return;

            const dx = worldX - beam.xPos;
            const dz = worldZ - beam.zPos;
            const distance3D = Math.sqrt(dx * dx + dz * dz + beam.verticalHeight * beam.verticalHeight);

            if (distance3D > 0.01) {
              totalIrr += fixtureData.peak_irradiance_mWm2 / (distance3D * distance3D);
            }
          });

          cells.push({ x: worldX, z: worldZ, totalIrr });
        }
      }

      return cells;
    }, [showHeatmap, roomWidth, roomDepth, beamData]);

    const toSvgX = useCallback((worldX: number): number => SVG_PADDING + (worldX / roomWidth) * drawWidth, [roomWidth, drawWidth]);
    const toSvgY = useCallback((worldY: number): number => SVG_PADDING + (worldY / roomDepth) * drawHeight, [roomDepth, drawHeight]);
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
          setSelectedFixture(fixtureId);
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
          setSelectedFixture(null);
        },
      });
    };

    const toggleView = useCallback(() => {
      Haptics.selectionAsync();
      setViewMode((previous) => (previous === 'top' ? 'side' : 'top'));
    }, []);

    const toggleHeatmap = useCallback(() => {
      Haptics.selectionAsync();
      setShowHeatmap((previous) => !previous);
    }, []);

    const resetPositions = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setFixturePositions({});
    }, []);

    const hasData = beamData.length > 0 && roomWidth > 0 && roomDepth > 0;

    const stats = useMemo(() => {
      if (!hasData) {
        return { maxIrr: 0, avgIrr: 0, safety: 'SAFE', coverage: 0 };
      }

      const irradiances = beamData.map((entry) => entry.irradiance);
      const maxIrr = Math.max(...irradiances);
      const avgIrr = irradiances.reduce((sum, current) => sum + current, 0) / irradiances.length;
      const coverage = ((beamData.length * 0.6) / (roomWidth * roomDepth)) * 100;

      return {
        maxIrr: Math.round(maxIrr),
        avgIrr: Math.round(avgIrr),
        safety: getSafetyLabel(maxIrr),
        coverage: Math.min(98, Math.round(coverage)),
      };
    }, [beamData, hasData, roomWidth, roomDepth]);

    const renderTopView = () => (
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

        {showHeatmap && heatmapData.map((cell, index) => {
          const cellX = toSvgX(cell.x) - drawWidth / GRID_SIZE / 2;
          const cellY = toSvgY(cell.z) - drawHeight / GRID_SIZE / 2;
          const size = drawWidth / GRID_SIZE;
          return (
            <Rect
              key={`heat-${index}`}
              x={cellX}
              y={cellY}
              width={size}
              height={size}
              fill={getSafetyColor(cell.totalIrr)}
              opacity={Math.min(0.65, cell.totalIrr / 35000)}
            />
          );
        })}

        {beamData.map((beam, index) => {
          const centerX = toSvgX(beam.xPos);
          const centerY = toSvgY(beam.zPos);
          const radiusX = Math.max(scaleX(beam.beamDiamH / 2), 8);
          const radiusY = Math.max((beam.beamDiamV / roomDepth) * drawHeight / 2, 8);

          return (
            <G key={`beam-${beam.id}`}>
              <Ellipse cx={centerX} cy={centerY} rx={radiusX} ry={radiusY} fill={`url(#beam-grad-${index})`} opacity={selectedFixture === beam.id ? 0.78 : 0.5} />
              <Ellipse cx={centerX} cy={centerY} rx={radiusX} ry={radiusY} fill="none" stroke={beam.color} strokeWidth={1.5} strokeDasharray="4,3" />
            </G>
          );
        })}

        {beamData.map((beam) => {
          const centerX = toSvgX(beam.xPos);
          const centerY = toSvgY(beam.zPos);
          const panResponder = createPanResponder(beam.id);
          const isSelected = selectedFixture === beam.id;

          return (
            <G key={`fixture-${beam.id}`} {...panResponder.panHandlers}>
              <Circle cx={centerX} cy={centerY} r={isSelected ? 11 : 9} fill={colors.surface} stroke={beam.color} strokeWidth={3} />
              <Circle cx={centerX} cy={centerY} r={4} fill={beam.color} />
              <SvgText x={centerX} y={centerY - 18} textAnchor="middle" fontSize="9" fontWeight="700" fill={beam.color}>
                {beam.model}
              </SvgText>
            </G>
          );
        })}

        <SvgText x={svgWidth / 2} y={svgHeight - 4} textAnchor="middle" fontSize="9" fill={colors.textTertiary}>
          {roomWidth.toFixed(1)} {unitLabel}
        </SvgText>
      </Svg>
    );

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

          return (
            <G key={`side-${beam.id}`}>
              <Line x1={fixtureX} y1={fixtureY} x2={fixtureX - beamHalfW} y2={floorY} stroke={beam.color} strokeWidth={1} opacity={0.5} strokeDasharray="4,3" />
              <Line x1={fixtureX} y1={fixtureY} x2={fixtureX + beamHalfW} y2={floorY} stroke={beam.color} strokeWidth={1} opacity={0.5} strokeDasharray="4,3" />
              <Ellipse cx={fixtureX} cy={(fixtureY + floorY) / 2} rx={beamHalfW / 2} ry={(floorY - fixtureY) / 2} fill={`url(#side-grad-${index})`} />
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
              <Circle cx={fixtureX} cy={fixtureY + 6} r={6} fill={colors.surface} stroke={beam.color} strokeWidth={1.5} />
              <Circle cx={fixtureX} cy={fixtureY + 6} r={2.5} fill={beam.color} />
            </G>
          );
        })}
      </Svg>
    );

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
              <Text style={styles.viewToggleText}>{viewMode === 'top' ? 'TOP' : 'SIDE'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <Layers size={32} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Add fixtures to begin simulation</Text>
          </View>
        ) : (
          <>
            <View style={styles.svgContainer}>{viewMode === 'top' ? renderTopView() : renderSideView()}</View>

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
          </>
        )}
      </View>
    );
  }
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
  });
}
