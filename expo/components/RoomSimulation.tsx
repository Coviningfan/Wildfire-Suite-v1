import React, { useMemo, useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder, Platform, GestureResponderHandlers } from 'react-native';
import { Eye, RefreshCw, Target, LayoutGrid, Move, Layers, Clock, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { DOSE_THRESHOLDS } from '@/types/lighting';

import {
  SimFixture,
  PersonMarker,
  SurfaceMode,
  RoomSimulationProps,
  FixtureBeamData,
  SurfaceStatsData,
  HeatmapStats,
  SVG_PADDING,
  FIXTURE_COLORS,
  getSafetyColor,
  getSafetyLabel,
  computeDoseMJcm2,
} from './simulation/types';

import { generateHeatmapData, computeHeatmapStats, computeAllSurfaceStats, computeIrradianceAtPoint } from './simulation/irradiance';
import { TopView } from './simulation/TopView';
import { SideView } from './simulation/SideView';
import { IsometricView } from './simulation/IsometricView';
import { StatsBar, DoseBar } from './simulation/StatsBar';

export type { SimFixture, PersonMarker, SurfaceStatsData };

function useContainerWidth() {
  const [width, setWidth] = useState(Dimensions.get('window').width - 32);
  const onLayout = useCallback((e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  }, []);
  return { containerWidth: width, onLayout };
}

const RoomSimulation = React.memo(
  ({
    roomWidth,
    roomDepth,
    roomHeight,
    fixtures,
    unitLabel,
    onFixturePositionChange,
    selectedFixtureId,
    onFixtureTap,
    calibrationFactor = 1,
    people = [],
    exposureMinutes = 0,
    floorMaterial = 'default',
    ceilingMaterial = 'default',
    wallMaterial = 'default',
    onSurfaceStatsChange,
  }: RoomSimulationProps) => {
    const colors = useThemeColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const calc = useMemo(() => new LightingCalculator(), []);
    const { containerWidth, onLayout } = useContainerWidth();

    const [viewMode, setViewMode] = useState<'top' | 'side' | 'iso'>('top');
    const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('floor');
    const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
    const [showDose, setShowDose] = useState<boolean>(false);
    const [showReflections, setShowReflections] = useState<boolean>(false);
    const [selectedFixtureInternal, setSelectedFixtureInternal] = useState<string | null>(null);
    const [fixturePositions, setFixturePositions] = useState<Record<string, { x: number; z: number }>>({});
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const svgWidth = containerWidth;
    const svgHeight = viewMode === 'top' ? svgWidth * 0.8 : viewMode === 'iso' ? svgWidth * 0.72 : svgWidth * 0.6;
    const drawWidth = svgWidth - SVG_PADDING * 2;
    const drawHeight = svgHeight - SVG_PADDING * 2;

    const svgRef = useRef<View>(null);
    const dragStartRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    }, [fixtures, roomWidth, roomDepth]);

    const beamData = useMemo<FixtureBeamData[]>(() => {
      if (roomWidth <= 0 || roomDepth <= 0) return [];

      return fixtures
        .map((fixture, index) => {
          if (!fixture.fixture) return null;

          const verticalHeight = parseFloat(fixture.verticalHeight) || roomHeight;
          const horizontalDistance = parseFloat(fixture.horizontalDistance) || 0;
          const result = calc.calculateRadiometricData(fixture.fixture, verticalHeight, horizontalDistance);

          if ('error' in result || !result.irradiance_report) return null;

          const report = result.irradiance_report;
          const fixtureData = LightingCalculator.getFixtureData(fixture.fixture);
          const basePosition = fixturePositions[fixture.id] ?? {
            x: fixture.xPos ?? roomWidth / 2,
            z: fixture.zPos ?? roomDepth / 2,
          };

          const clampedX = Math.max(
            report.beam_diameter_h_m / 2,
            Math.min(basePosition.x, roomWidth - report.beam_diameter_h_m / 2),
          );
          const clampedZ = Math.max(
            report.beam_diameter_v_m / 2,
            Math.min(basePosition.z, roomDepth - report.beam_diameter_v_m / 2),
          );

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
            tiltAngle: fixture.tiltAngle ?? 0,
            beamHDeg: fixtureData?.beam_h_deg || 90,
            beamVDeg: fixtureData?.beam_v_deg || fixtureData?.beam_h_deg || 90,
            peakIrradiance: fixtureData?.peak_irradiance_mWm2 || 0,
          };
        })
        .filter(Boolean) as FixtureBeamData[];
    }, [fixtures, fixturePositions, roomWidth, roomDepth, roomHeight, calc, calibrationFactor]);

    const heatmapData = useMemo(() => {
      if (!showHeatmap || beamData.length === 0) return [];
      return generateHeatmapData(
        surfaceMode, roomWidth, roomDepth, roomHeight,
        beamData, calibrationFactor, showReflections,
        floorMaterial, ceilingMaterial, wallMaterial,
      );
    }, [beamData, showHeatmap, surfaceMode, roomWidth, roomDepth, roomHeight, calibrationFactor, showReflections, floorMaterial, ceilingMaterial, wallMaterial]);

    const heatmapStats = useMemo(() => computeHeatmapStats(heatmapData), [heatmapData]);

    const allSurfaceStats = useMemo<SurfaceStatsData[]>(
      () => computeAllSurfaceStats(roomWidth, roomDepth, roomHeight, beamData, calibrationFactor),
      [roomWidth, roomDepth, roomHeight, beamData, calibrationFactor],
    );

    useEffect(() => {
      if (onSurfaceStatsChange && allSurfaceStats.length > 0) {
        onSurfaceStatsChange(allSurfaceStats);
      }
    }, [allSurfaceStats, onSurfaceStatsChange]);

    const panRespondersRef = useRef<Record<string, { panHandlers: GestureResponderHandlers }>>({});
    const beamDataRef = useRef(beamData);
    beamDataRef.current = beamData;

    const fixtureIdsKey = fixtures.map((f) => f.id).join(',');

    useEffect(() => {
      const responders: Record<string, { panHandlers: GestureResponderHandlers }> = {};

      fixtures.forEach((fixture) => {
        const fixtureId = fixture.id;
        const responder = PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const beam = beamDataRef.current.find((entry) => entry.id === fixtureId);
            if (beam) {
              dragStartRef.current = { x: beam.xPos, z: beam.zPos };
            }
            setSelectedFixtureInternal(fixtureId);
            setDraggingId(fixtureId);
            if (onFixtureTap) onFixtureTap(fixtureId);
          },
          onPanResponderMove: (_, gestureState) => {
            const beam = beamDataRef.current.find((entry) => entry.id === fixtureId);
            if (!beam || drawWidth < 1 || drawHeight < 1 || roomWidth <= 0 || roomDepth <= 0) return;

            const movedX = dragStartRef.current.x + (gestureState.dx / drawWidth) * roomWidth;
            const movedZ = dragStartRef.current.z + (gestureState.dy / drawHeight) * roomDepth;

            const nextX = Math.max(0.1, Math.min(movedX, roomWidth - 0.1));
            const nextZ = Math.max(0.1, Math.min(movedZ, roomDepth - 0.1));

            setFixturePositions((previous) => ({ ...previous, [fixtureId]: { x: nextX, z: nextZ } }));

            if (onFixturePositionChange) {
              onFixturePositionChange(fixtureId, nextX, nextZ);
            }
          },
          onPanResponderRelease: () => {
            setDraggingId(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        });
        responders[fixtureId] = responder;
      });

      panRespondersRef.current = responders;
    }, [fixtureIdsKey, drawWidth, drawHeight, roomWidth, roomDepth, onFixturePositionChange, onFixtureTap]);

    const handleWebPointerDown = useCallback(
      (fixtureId: string, e: any) => {
        e.preventDefault?.();
        e.stopPropagation?.();

        const beam = beamData.find((b) => b.id === fixtureId);
        if (!beam) return;

        dragStartRef.current = { x: beam.xPos, z: beam.zPos };
        dragOffsetRef.current = { x: e.clientX || e.pageX || 0, y: e.clientY || e.pageY || 0 };
        setSelectedFixtureInternal(fixtureId);
        setDraggingId(fixtureId);
        if (onFixtureTap) onFixtureTap(fixtureId);

        const handleMove = (moveEvent: any) => {
          moveEvent.preventDefault?.();
          const clientX = moveEvent.clientX || moveEvent.pageX || 0;
          const clientY = moveEvent.clientY || moveEvent.pageY || 0;
          const dx = clientX - dragOffsetRef.current.x;
          const dy = clientY - dragOffsetRef.current.y;

          const currentBeam = beamDataRef.current.find((b) => b.id === fixtureId);
          if (!currentBeam || drawWidth < 1 || drawHeight < 1 || roomWidth <= 0 || roomDepth <= 0) return;

          const movedX = dragStartRef.current.x + (dx / drawWidth) * roomWidth;
          const movedZ = dragStartRef.current.z + (dy / drawHeight) * roomDepth;

          const nextX = Math.max(0.1, Math.min(movedX, roomWidth - 0.1));
          const nextZ = Math.max(0.1, Math.min(movedZ, roomDepth - 0.1));

          setFixturePositions((prev) => ({ ...prev, [fixtureId]: { x: nextX, z: nextZ } }));

          if (onFixturePositionChange) {
            onFixturePositionChange(fixtureId, nextX, nextZ);
          }
        };

        const handleUp = () => {
          setDraggingId(null);
          document.removeEventListener('pointermove', handleMove);
          document.removeEventListener('pointerup', handleUp);
        };

        document.addEventListener('pointermove', handleMove);
        document.addEventListener('pointerup', handleUp);
      },
      [beamData, drawWidth, drawHeight, roomWidth, roomDepth, onFixturePositionChange, onFixtureTap],
    );

    const toggleView = useCallback(() => {
      Haptics.selectionAsync();
      setViewMode((previous) => {
        if (previous === 'top') return 'side';
        if (previous === 'side') return 'iso';
        return 'top';
      });
    }, []);

    const toggleHeatmap = useCallback(() => { Haptics.selectionAsync(); setShowHeatmap((p) => !p); }, []);
    const toggleDose = useCallback(() => { Haptics.selectionAsync(); setShowDose((p) => !p); }, []);
    const toggleReflections = useCallback(() => { Haptics.selectionAsync(); setShowReflections((p) => !p); }, []);

    const resetPositions = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setFixturePositions({});
      if (onFixturePositionChange) {
        fixtures.forEach((f) => {
          onFixturePositionChange(f.id, roomWidth / 2, roomDepth / 2);
        });
      }
    }, [fixtures, onFixturePositionChange, roomWidth, roomDepth]);

    const handleSurfaceModeChange = useCallback(
      (mode: SurfaceMode) => {
        Haptics.selectionAsync();
        setSurfaceMode(mode);
        if (viewMode !== 'top') setViewMode('top');
      },
      [viewMode],
    );

    const applyAutoLayout = useCallback(
      (mode: 'line' | 'grid' | 'perimeter') => {
        if (!fixtures.length || roomWidth <= 0 || roomDepth <= 0) return;

        const nextPositions: Record<string, { x: number; z: number }> = {};
        const clampPos = (x: number, z: number) => ({
          x: Math.max(0.2, Math.min(x, roomWidth - 0.2)),
          z: Math.max(0.2, Math.min(z, roomDepth - 0.2)),
        });

        if (mode === 'line') {
          const spacing = roomWidth / (fixtures.length + 1);
          fixtures.forEach((fixture, index) => {
            nextPositions[fixture.id] = clampPos(spacing * (index + 1), roomDepth / 2);
          });
        } else if (mode === 'grid') {
          const cols = Math.max(1, Math.ceil(Math.sqrt(fixtures.length)));
          const rows = Math.max(1, Math.ceil(fixtures.length / cols));
          fixtures.forEach((fixture, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            nextPositions[fixture.id] = clampPos(((col + 1) / (cols + 1)) * roomWidth, ((row + 1) / (rows + 1)) * roomDepth);
          });
        } else {
          const cx = roomWidth / 2;
          const cz = roomDepth / 2;
          const rx = Math.max(roomWidth * 0.42, 0.6);
          const rz = Math.max(roomDepth * 0.42, 0.6);
          fixtures.forEach((fixture, index) => {
            const angle = (index / Math.max(fixtures.length, 1)) * Math.PI * 2;
            nextPositions[fixture.id] = clampPos(cx + Math.cos(angle) * rx, cz + Math.sin(angle) * rz);
          });
        }

        setFixturePositions((previous) => ({ ...previous, ...nextPositions }));
        if (onFixturePositionChange) {
          Object.entries(nextPositions).forEach(([id, pos]) => {
            onFixturePositionChange(id, pos.x, pos.z);
          });
        }
        Haptics.selectionAsync();
      },
      [fixtures, roomDepth, roomWidth, onFixturePositionChange],
    );

    const hasData = beamData.length > 0 && roomWidth > 0 && roomDepth > 0;

    const stats = useMemo(() => {
      if (!hasData) return { maxIrr: 0, avgIrr: 0, minIrr: 0, safety: 'SAFE', coverage: 0 };
      return {
        maxIrr: heatmapStats.max,
        avgIrr: heatmapStats.avg,
        minIrr: heatmapStats.min,
        safety: getSafetyLabel(heatmapStats.max),
        coverage: heatmapStats.coverage,
      };
    }, [hasData, heatmapStats]);

    const doseStats = useMemo(() => {
      if (!hasData || exposureMinutes <= 0) return null;
      const maxDose = computeDoseMJcm2(heatmapStats.max, exposureMinutes);
      const avgDose = computeDoseMJcm2(heatmapStats.avg, exposureMinutes);
      const safeMinutes = heatmapStats.max > 0
        ? (DOSE_THRESHOLDS.acgih_tlv_365nm * 10 * 1000) / (heatmapStats.max * 60)
        : Infinity;
      return { maxDose: Math.round(maxDose * 10) / 10, avgDose: Math.round(avgDose * 10) / 10, safeMinutes: Math.round(safeMinutes * 10) / 10 };
    }, [hasData, heatmapStats, exposureMinutes]);

    const activeSelectionId = selectedFixtureId ?? selectedFixtureInternal;
    const isHorizontalSurface = surfaceMode === 'floor' || surfaceMode === 'ceiling';

    const getFixtureHandlers = useCallback(
      (fixtureId: string): any => {
        if (!isHorizontalSurface) return {};
        if (Platform.OS === 'web') {
          return {
            onPointerDown: (e: any) => handleWebPointerDown(fixtureId, e),
            style: { cursor: draggingId === fixtureId ? 'grabbing' : 'grab', touchAction: 'none' },
          };
        }
        return panRespondersRef.current[fixtureId]?.panHandlers ?? {};
      },
      [isHorizontalSurface, handleWebPointerDown, draggingId],
    );

    const peopleReadouts = useMemo(() => {
      if (!people.length || !beamData.length) return [] as { id: string; label: string; irr: number; dose: number; level: string }[];
      return people.map((p) => {
        let maxIrr = 0;
        beamData.forEach((beam) => {
          const dx = p.x - beam.xPos;
          const dz = p.z - beam.zPos;
          const dy = p.heightM - beam.verticalHeight;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > 0.01) {
            const axisLen = Math.abs(dy);
            const offAxis = Math.sqrt(dx * dx + dz * dz);
            const halfConeH = (beam.beamHDeg / 2) * (Math.PI / 180);
            const coneAngle = axisLen > 0.01 ? Math.atan2(offAxis, axisLen) : (offAxis > 0.01 ? Math.PI / 2 : 0);
            if (coneAngle <= halfConeH) {
              const irr = (beam.peakIrradiance * calibrationFactor) / (dist * dist);
              if (irr > maxIrr) maxIrr = irr;
            }
          }
        });
        const dose = computeDoseMJcm2(maxIrr, p.dwellMinutes);
        return { id: p.id, label: p.label, irr: Math.round(maxIrr), dose: Math.round(dose * 10) / 10, level: getSafetyLabel(maxIrr) };
      });
    }, [beamData, calibrationFactor, people]);

    const surfaceTabs: { id: SurfaceMode; label: string }[] = [
      { id: 'floor', label: 'Floor' },
      { id: 'backWall', label: 'Back Wall' },
      { id: 'leftWall', label: 'Left Wall' },
      { id: 'rightWall', label: 'Right Wall' },
      { id: 'ceiling', label: 'Ceiling' },
    ];

    return (
      <View style={styles.container} onLayout={onLayout}>
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <TouchableOpacity testID="toggle-heatmap-button" style={[styles.controlBtn, showHeatmap && styles.controlBtnActive]} onPress={toggleHeatmap}>
              <Target size={14} color={showHeatmap ? colors.accent : colors.textTertiary} />
            </TouchableOpacity>
            {exposureMinutes > 0 && (
              <TouchableOpacity style={[styles.controlBtn, showDose && styles.controlBtnActive]} onPress={toggleDose}>
                <Clock size={14} color={showDose ? colors.accent : colors.textTertiary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.controlBtn, showReflections && styles.controlBtnActive]} onPress={toggleReflections}>
              <Zap size={14} color={showReflections ? colors.accent : colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity testID="reset-positions-button" style={styles.controlBtn} onPress={resetPositions}>
              <RefreshCw size={14} color={colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity testID="toggle-view-button" style={styles.viewToggle} onPress={toggleView}>
              <Eye size={13} color={colors.primary} />
              <Text style={styles.viewToggleText}>{viewMode === 'top' ? 'TOP' : viewMode === 'side' ? 'SIDE' : '3D'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.surfaceTabs}>
          {surfaceTabs.map((tab) => {
            const active = surfaceMode === tab.id;
            return (
              <TouchableOpacity key={tab.id} style={[styles.surfaceTab, active && styles.surfaceTabActive]} onPress={() => handleSurfaceModeChange(tab.id)} activeOpacity={0.7}>
                <Text style={[styles.surfaceTabText, active && styles.surfaceTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.layoutRow}>
          <View style={styles.layoutTitleWrap}>
            <LayoutGrid size={14} color={colors.textTertiary} />
            <Text style={styles.layoutTitle}>Auto Layout</Text>
          </View>
          <View style={styles.layoutButtons}>
            <TouchableOpacity style={styles.layoutBtn} onPress={() => applyAutoLayout('line')} activeOpacity={0.7}>
              <Text style={styles.layoutBtnText}>Line</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.layoutBtn} onPress={() => applyAutoLayout('grid')} activeOpacity={0.7}>
              <Text style={styles.layoutBtnText}>Grid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.layoutBtn} onPress={() => applyAutoLayout('perimeter')} activeOpacity={0.7}>
              <Text style={styles.layoutBtnText}>Perimeter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <Layers size={32} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Add fixtures to begin simulation</Text>
            {isHorizontalSurface && (
              <View style={styles.dragHint}>
                <Move size={12} color={colors.textTertiary} />
                <Text style={styles.dragHintText}>Drag fixtures to reposition in top view</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.svgContainer}>
              {viewMode === 'top' ? (
                <TopView
                  beamData={beamData}
                  heatmapData={heatmapData}
                  heatmapStats={heatmapStats}
                  svgWidth={svgWidth}
                  svgHeight={svgHeight}
                  drawWidth={drawWidth}
                  drawHeight={drawHeight}
                  roomWidth={roomWidth}
                  roomDepth={roomDepth}
                  roomHeight={roomHeight}
                  unitLabel={unitLabel}
                  surfaceMode={surfaceMode}
                  showHeatmap={showHeatmap}
                  showDose={showDose}
                  exposureMinutes={exposureMinutes}
                  activeSelectionId={activeSelectionId}
                  draggingId={draggingId}
                  colors={colors}
                  svgRef={svgRef}
                  getFixtureHandlers={getFixtureHandlers}
                  handleWebPointerDown={handleWebPointerDown}
                />
              ) : viewMode === 'side' ? (
                <SideView
                  beamData={beamData}
                  svgWidth={svgWidth}
                  svgHeight={svgHeight}
                  drawWidth={drawWidth}
                  drawHeight={drawHeight}
                  roomWidth={roomWidth}
                  roomHeight={roomHeight}
                  unitLabel={unitLabel}
                  activeSelectionId={activeSelectionId}
                  colors={colors}
                />
              ) : (
                <IsometricView
                  beamData={beamData}
                  svgWidth={svgWidth}
                  svgHeight={svgHeight}
                  drawWidth={drawWidth}
                  drawHeight={drawHeight}
                  roomWidth={roomWidth}
                  roomDepth={roomDepth}
                  roomHeight={roomHeight}
                  unitLabel={unitLabel}
                  surfaceMode={surfaceMode}
                  activeSelectionId={activeSelectionId}
                  colors={colors}
                />
              )}
            </View>

            {isHorizontalSurface && viewMode === 'top' && (
              <View style={styles.dragHint}>
                <Move size={12} color={colors.textTertiary} />
                <Text style={styles.dragHintText}>Drag fixtures to reposition</Text>
              </View>
            )}

            <StatsBar stats={stats} colors={colors} />

            {doseStats && (
              <DoseBar
                maxDose={doseStats.maxDose}
                avgDose={doseStats.avgDose}
                safeMinutes={doseStats.safeMinutes}
                exposureMinutes={exposureMinutes}
                colors={colors}
              />
            )}

            {beamData.length > 1 && (
              <View style={styles.legendRow}>
                {beamData.map((beam) => (
                  <View key={`legend-${beam.id}`} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: beam.color }]} />
                    <Text style={styles.legendText} numberOfLines={1}>{beam.model}</Text>
                    <Text style={[styles.legendIrr, { color: getSafetyColor(beam.irradiance) }]}>{Math.round(beam.irradiance)}</Text>
                  </View>
                ))}
              </View>
            )}

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
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
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
    controlBtnActive: {
      borderColor: 'rgba(232, 65, 42, 0.3)',
      backgroundColor: 'rgba(232, 65, 42, 0.06)',
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
    layoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingBottom: 10,
      gap: 8,
    },
    layoutTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    layoutTitle: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    layoutButtons: {
      flexDirection: 'row',
      gap: 6,
    },
    layoutBtn: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    layoutBtnText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.textSecondary,
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
      position: 'relative' as const,
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
    dragHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    dragHintText: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '500' as const,
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
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      maxWidth: 80,
    },
    legendIrr: {
      fontSize: 10,
      fontWeight: '700' as const,
    },
  });
}
