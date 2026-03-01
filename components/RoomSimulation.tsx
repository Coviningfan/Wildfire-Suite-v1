import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Rect, Ellipse, Line, Defs, RadialGradient, Stop, G, Circle, Text as SvgText } from 'react-native-svg';
import { Eye, Layers, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useTheme';
import { ThemeColors } from '@/constants/theme';
import { LightingCalculator } from '@/utils/lighting-calculator';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SVG_PADDING = 28;
const FIXTURE_COLORS = ['#E8412A', '#3B9FE8', '#22C55E', '#F5A623', '#7C6BF0', '#F97316'];

interface SimFixture {
  id: string;
  fixture: string;
  verticalHeight: string;
  horizontalDistance: string;
  beamWidth: string;
  beamHeight: string;
}

interface RoomSimulationProps {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  fixtures: SimFixture[];
  unitLabel: string;
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

const RoomSimulation = React.memo(({ roomWidth, roomDepth, roomHeight, fixtures, unitLabel }: RoomSimulationProps) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [viewMode, setViewMode] = React.useState<'top' | 'side'>('top');

  const beamAnims = useRef<Animated.Value[]>([]);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    while (beamAnims.current.length < fixtures.length) {
      beamAnims.current.push(new Animated.Value(0));
    }
    fixtures.forEach((_, i) => {
      const anim = beamAnims.current[i];
      if (anim) {
        anim.setValue(0);
        Animated.spring(anim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          delay: i * 150,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [fixtures, fixtures.length]);

  const calc = useMemo(() => new LightingCalculator(), []);

  const beamData = useMemo<FixtureBeamData[]>(() => {
    if (roomWidth <= 0 || roomDepth <= 0) return [];
    return fixtures.map((f, i) => {
      if (!f.fixture) return null;
      const vH = parseFloat(f.verticalHeight) || roomHeight;
      const hD = parseFloat(f.horizontalDistance) || 0;
      const result = calc.calculateRadiometricData(f.fixture, vH, hD);
      if ('error' in result) return null;
      const r = result.irradiance_report;
      const spacing = roomWidth / (fixtures.length + 1);
      const xPos = spacing * (i + 1);
      const zPos = roomDepth / 2 + hD;
      return {
        id: f.id,
        model: f.fixture,
        color: FIXTURE_COLORS[i % FIXTURE_COLORS.length],
        throwDistance: r.throw_distance_m,
        beamDiamH: Math.min(r.beam_diameter_h_m, roomWidth),
        beamDiamV: Math.min(r.beam_diameter_v_m, roomDepth),
        irradiance: r.irradiance_mWm2,
        safetyLevel: getSafetyLabel(r.irradiance_mWm2),
        verticalHeight: vH,
        horizontalDistance: hD,
        xPos: Math.min(Math.max(xPos, r.beam_diameter_h_m / 2), roomWidth - r.beam_diameter_h_m / 2),
        zPos: Math.min(Math.max(zPos, r.beam_diameter_v_m / 2), roomDepth - r.beam_diameter_v_m / 2),
      };
    }).filter(Boolean) as FixtureBeamData[];
  }, [fixtures, roomWidth, roomDepth, roomHeight, calc]);

  const svgWidth = SCREEN_WIDTH - 32;
  const svgHeight = viewMode === 'top' ? svgWidth * 0.7 : svgWidth * 0.55;
  const drawWidth = svgWidth - SVG_PADDING * 2;
  const drawHeight = svgHeight - SVG_PADDING * 2;

  const toSvgX = useCallback((worldX: number) => {
    if (roomWidth <= 0) return SVG_PADDING;
    return SVG_PADDING + (worldX / roomWidth) * drawWidth;
  }, [roomWidth, drawWidth]);

  const toSvgY = useCallback((worldY: number) => {
    if (roomDepth <= 0) return SVG_PADDING;
    return SVG_PADDING + (worldY / roomDepth) * drawHeight;
  }, [roomDepth, drawHeight]);

  const scaleX = useCallback((dist: number) => {
    if (roomWidth <= 0) return 0;
    return (dist / roomWidth) * drawWidth;
  }, [roomWidth, drawWidth]);

  const scaleY = useCallback((dist: number) => {
    if (roomDepth <= 0) return 0;
    return (dist / roomDepth) * drawHeight;
  }, [roomDepth, drawHeight]);

  const toggleView = useCallback(() => {
    Haptics.selectionAsync();
    setViewMode(v => v === 'top' ? 'side' : 'top');
  }, []);

  const hasData = beamData.length > 0 && roomWidth > 0 && roomDepth > 0;

  const renderTopView = () => (
    <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
      <Defs>
        {beamData.map((bd, i) => (
          <RadialGradient key={`grad-${bd.id}`} id={`beam-grad-${i}`} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={bd.color} stopOpacity="0.45" />
            <Stop offset="40%" stopColor={bd.color} stopOpacity="0.25" />
            <Stop offset="75%" stopColor={bd.color} stopOpacity="0.1" />
            <Stop offset="100%" stopColor={bd.color} stopOpacity="0" />
          </RadialGradient>
        ))}
      </Defs>

      <Rect
        x={SVG_PADDING}
        y={SVG_PADDING}
        width={drawWidth}
        height={drawHeight}
        fill={colors.surfaceSecondary}
        stroke={colors.border}
        strokeWidth={1.5}
        rx={4}
      />

      {[0.25, 0.5, 0.75].map(frac => (
        <G key={`grid-h-${frac}`}>
          <Line
            x1={SVG_PADDING}
            y1={SVG_PADDING + drawHeight * frac}
            x2={SVG_PADDING + drawWidth}
            y2={SVG_PADDING + drawHeight * frac}
            stroke={colors.border}
            strokeWidth={0.5}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </G>
      ))}
      {[0.25, 0.5, 0.75].map(frac => (
        <G key={`grid-v-${frac}`}>
          <Line
            x1={SVG_PADDING + drawWidth * frac}
            y1={SVG_PADDING}
            x2={SVG_PADDING + drawWidth * frac}
            y2={SVG_PADDING + drawHeight}
            stroke={colors.border}
            strokeWidth={0.5}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </G>
      ))}

      <SvgText x={svgWidth / 2} y={svgHeight - 4} textAnchor="middle" fontSize={9} fill={colors.textTertiary}>
        {roomWidth.toFixed(1)} {unitLabel}
      </SvgText>
      <SvgText x={8} y={svgHeight / 2} textAnchor="middle" fontSize={9} fill={colors.textTertiary} rotation={-90} originX={8} originY={svgHeight / 2}>
        {roomDepth.toFixed(1)} {unitLabel}
      </SvgText>

      {beamData.map((bd, i) => {
        const cx = toSvgX(bd.xPos);
        const cy = toSvgY(bd.zPos);
        const rx = Math.max(scaleX(bd.beamDiamH / 2), 6);
        const ry = Math.max(scaleY(bd.beamDiamV / 2), 6);
        return (
          <G key={`beam-${bd.id}`}>
            <Ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={`url(#beam-grad-${i})`}
            />
            <Ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={bd.color}
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.6}
            />
          </G>
        );
      })}

      {beamData.map((bd) => {
        const cx = toSvgX(bd.xPos);
        const cy = toSvgY(bd.zPos);
        return (
          <G key={`fixture-${bd.id}`}>
            <Circle cx={cx} cy={cy} r={8} fill={colors.surface} stroke={bd.color} strokeWidth={2} />
            <Circle cx={cx} cy={cy} r={3} fill={bd.color} />
            <SvgText x={cx} y={cy - 13} textAnchor="middle" fontSize={8} fontWeight="700" fill={bd.color}>
              {bd.model}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );

  const renderSideView = () => (
    <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
      <Defs>
        {beamData.map((bd, i) => (
          <RadialGradient key={`sgrad-${bd.id}`} id={`side-grad-${i}`} cx="50%" cy="0%" rx="50%" ry="100%">
            <Stop offset="0%" stopColor={bd.color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={bd.color} stopOpacity="0.05" />
          </RadialGradient>
        ))}
      </Defs>

      <Rect
        x={SVG_PADDING}
        y={SVG_PADDING}
        width={drawWidth}
        height={drawHeight}
        fill={colors.surfaceSecondary}
        stroke={colors.border}
        strokeWidth={1.5}
        rx={4}
      />

      <Line
        x1={SVG_PADDING}
        y1={SVG_PADDING + drawHeight}
        x2={SVG_PADDING + drawWidth}
        y2={SVG_PADDING + drawHeight}
        stroke={colors.textTertiary}
        strokeWidth={2}
      />

      <Line
        x1={SVG_PADDING}
        y1={SVG_PADDING}
        x2={SVG_PADDING + drawWidth}
        y2={SVG_PADDING}
        stroke={colors.textTertiary}
        strokeWidth={1}
        strokeDasharray="6,3"
        opacity={0.5}
      />

      <SvgText x={svgWidth / 2} y={svgHeight - 4} textAnchor="middle" fontSize={9} fill={colors.textTertiary}>
        {roomWidth.toFixed(1)} {unitLabel}
      </SvgText>
      <SvgText x={8} y={svgHeight / 2} textAnchor="middle" fontSize={9} fill={colors.textTertiary} rotation={-90} originX={8} originY={svgHeight / 2}>
        {roomHeight.toFixed(1)} {unitLabel}
      </SvgText>

      <SvgText x={SVG_PADDING + 4} y={SVG_PADDING + 10} fontSize={7} fill={colors.textTertiary} opacity={0.7}>
        Ceiling
      </SvgText>
      <SvgText x={SVG_PADDING + 4} y={SVG_PADDING + drawHeight - 4} fontSize={7} fill={colors.textTertiary} opacity={0.7}>
        Floor
      </SvgText>

      {beamData.map((bd, i) => {
        const fixtureX = toSvgX(bd.xPos);
        const fixtureY = SVG_PADDING + 2;
        const floorY = SVG_PADDING + drawHeight;
        const beamHalfW = Math.max(scaleX(bd.beamDiamH / 2), 8);

        return (
          <G key={`sbeam-${bd.id}`}>
            <Line
              x1={fixtureX}
              y1={fixtureY}
              x2={fixtureX - beamHalfW}
              y2={floorY}
              stroke={bd.color}
              strokeWidth={1}
              opacity={0.5}
              strokeDasharray="4,3"
            />
            <Line
              x1={fixtureX}
              y1={fixtureY}
              x2={fixtureX + beamHalfW}
              y2={floorY}
              stroke={bd.color}
              strokeWidth={1}
              opacity={0.5}
              strokeDasharray="4,3"
            />

            <Ellipse
              cx={fixtureX}
              cy={(fixtureY + floorY) / 2}
              rx={beamHalfW / 2}
              ry={(floorY - fixtureY) / 2}
              fill={`url(#side-grad-${i})`}
            />

            <Line
              x1={fixtureX - beamHalfW}
              y1={floorY}
              x2={fixtureX + beamHalfW}
              y2={floorY}
              stroke={getSafetyColor(bd.irradiance)}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.8}
            />

            <Circle cx={fixtureX} cy={fixtureY + 6} r={6} fill={colors.surface} stroke={bd.color} strokeWidth={1.5} />
            <Circle cx={fixtureX} cy={fixtureY + 6} r={2.5} fill={bd.color} />
            <SvgText x={fixtureX} y={fixtureY + 20} textAnchor="middle" fontSize={7} fontWeight="600" fill={bd.color}>
              {bd.model}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Layers size={14} color={colors.accent} />
          <Text style={styles.headerTitle}>Room Simulation</Text>
        </View>
        <TouchableOpacity style={styles.viewToggle} onPress={toggleView} activeOpacity={0.7}>
          <Eye size={12} color={colors.primary} />
          <Text style={styles.viewToggleText}>{viewMode === 'top' ? 'Top View' : 'Side View'}</Text>
          <RotateCcw size={10} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Layers size={28} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Add fixtures above</Text>
          <Text style={styles.emptySubtitle}>Select fixture models to see the beam simulation</Text>
        </View>
      ) : (
        <View style={styles.svgContainer}>
          {viewMode === 'top' ? renderTopView() : renderSideView()}
        </View>
      )}

      {hasData && (
        <View style={styles.legend}>
          {beamData.map((bd) => (
            <View key={`leg-${bd.id}`} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bd.color }]} />
              <Text style={styles.legendModel} numberOfLines={1}>{bd.model}</Text>
              <View style={[styles.legendSafety, { backgroundColor: getSafetyColor(bd.irradiance) + '20' }]}>
                <Text style={[styles.legendSafetyText, { color: getSafetyColor(bd.irradiance) }]}>
                  {bd.irradiance.toFixed(0)} mW/m²
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.legendDivider} />
          <View style={styles.legendRow}>
            <View style={styles.legendColorItem}>
              <View style={[styles.legendColorDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendColorLabel}>Safe</Text>
            </View>
            <View style={styles.legendColorItem}>
              <View style={[styles.legendColorDot, { backgroundColor: '#F5A623' }]} />
              <Text style={styles.legendColorLabel}>Caution</Text>
            </View>
            <View style={styles.legendColorItem}>
              <View style={[styles.legendColorDot, { backgroundColor: '#F97316' }]} />
              <Text style={styles.legendColorLabel}>Warning</Text>
            </View>
            <View style={styles.legendColorItem}>
              <View style={[styles.legendColorDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendColorLabel}>Danger</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

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
    emptySubtitle: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    legend: {
      paddingHorizontal: 14,
      paddingBottom: 12,
      gap: 6,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendModel: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      flex: 1,
    },
    legendSafety: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    legendSafetyText: {
      fontSize: 10,
      fontWeight: '700' as const,
    },
    legendDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    legendColorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendColorDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendColorLabel: {
      fontSize: 9,
      fontWeight: '600' as const,
      color: colors.textTertiary,
    },
  });
}
