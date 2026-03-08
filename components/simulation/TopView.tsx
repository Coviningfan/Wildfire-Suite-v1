import React, { useMemo } from 'react';
import { View, Platform } from 'react-native';
import Svg, { Rect, Ellipse, Line, Defs, RadialGradient, Stop, G, Circle, Text as SvgText, Polygon } from 'react-native-svg';
import { ThemeColors } from '@/constants/theme';
import {
  FixtureBeamData,
  HeatmapCell,
  HeatmapStats,
  SurfaceMode,
  SVG_PADDING,
  GRID_SIZE,
  interpolateGradient,
  computeDoseMJcm2,
} from './types';
import { renderAxisLabels } from './AxisLabels';

interface TopViewProps {
  beamData: FixtureBeamData[];
  heatmapData: HeatmapCell[];
  heatmapStats: HeatmapStats;
  svgWidth: number;
  svgHeight: number;
  drawWidth: number;
  drawHeight: number;
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  unitLabel: string;
  surfaceMode: SurfaceMode;
  showHeatmap: boolean;
  showDose: boolean;
  exposureMinutes: number;
  activeSelectionId: string | null;
  draggingId: string | null;
  colors: ThemeColors;
  svgRef: React.RefObject<View | null>;
  getFixtureHandlers: (fixtureId: string) => any;
  handleWebPointerDown: (fixtureId: string, e: any) => void;
}

export const TopView = React.memo(({
  beamData,
  heatmapData,
  heatmapStats,
  svgWidth,
  svgHeight,
  drawWidth,
  drawHeight,
  roomWidth,
  roomDepth,
  roomHeight,
  unitLabel,
  surfaceMode,
  showHeatmap,
  showDose,
  exposureMinutes,
  activeSelectionId,
  draggingId,
  colors,
  svgRef,
  getFixtureHandlers,
  handleWebPointerDown,
}: TopViewProps) => {
  const isHorizontalSurface = surfaceMode === 'floor' || surfaceMode === 'ceiling';
  const isSideWall = surfaceMode === 'leftWall' || surfaceMode === 'rightWall';
  const spanX = isHorizontalSurface ? roomWidth : isSideWall ? roomDepth : roomWidth;
  const spanY = isHorizontalSurface ? roomDepth : roomHeight;

  const projectSurfacePoint = (point: { x: number; y: number; z: number }) => {
    const worldSurfaceX = isHorizontalSurface ? point.x : isSideWall ? point.z : point.x;
    const worldSurfaceY = isHorizontalSurface ? point.z : point.y;
    const invertY = !isHorizontalSurface;
    return {
      x: SVG_PADDING + (worldSurfaceX / spanX) * drawWidth,
      y: invertY
        ? SVG_PADDING + ((spanY - worldSurfaceY) / spanY) * drawHeight
        : SVG_PADDING + (worldSurfaceY / spanY) * drawHeight,
    };
  };

  const maxIrrForColor = Math.max(heatmapStats.max, 1);
  const maxDoseForColor = exposureMinutes > 0 ? computeDoseMJcm2(maxIrrForColor, exposureMinutes) : 1;

  const heatmapRects = useMemo(() => {
    if (!showHeatmap) return null;
    const cellWidth = drawWidth / GRID_SIZE;
    const cellHeight = drawHeight / GRID_SIZE;

    return heatmapData.map((cell, index) => {
      const center = projectSurfacePoint(cell);
      let colorVal: string;
      let opacityVal: number;

      if (showDose && exposureMinutes > 0) {
        const dose = computeDoseMJcm2(cell.totalIrr, exposureMinutes);
        const t = maxDoseForColor > 0 ? dose / maxDoseForColor : 0;
        colorVal = interpolateGradient(t);
        opacityVal = Math.min(0.75, t * 0.75 + 0.05);
      } else {
        const t = maxIrrForColor > 0 ? cell.totalIrr / maxIrrForColor : 0;
        colorVal = interpolateGradient(t);
        opacityVal = Math.min(0.75, t * 0.75 + 0.05);
      }

      return (
        <Rect
          key={`heat-${index}`}
          x={center.x - cellWidth / 2}
          y={center.y - cellHeight / 2}
          width={cellWidth}
          height={cellHeight}
          fill={colorVal}
          opacity={opacityVal}
        />
      );
    });
  }, [heatmapData, showHeatmap, showDose, exposureMinutes, maxIrrForColor, maxDoseForColor, drawWidth, drawHeight]);

  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const gridCount = 4;
    for (let i = 1; i < gridCount; i++) {
      const frac = i / gridCount;
      lines.push(
        <G key={`grid-${frac}`}>
          <Line x1={SVG_PADDING} y1={SVG_PADDING + drawHeight * frac} x2={SVG_PADDING + drawWidth} y2={SVG_PADDING + drawHeight * frac} stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,4" opacity={0.5} />
          <Line x1={SVG_PADDING + drawWidth * frac} y1={SVG_PADDING} x2={SVG_PADDING + drawWidth * frac} y2={SVG_PADDING + drawHeight} stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,4" opacity={0.5} />
        </G>,
      );
    }
    return lines;
  }, [drawWidth, drawHeight, colors.border]);

  const legendWidth = drawWidth * 0.6;
  const legendX = SVG_PADDING + (drawWidth - legendWidth) / 2;
  const legendY = SVG_PADDING + drawHeight + 14;
  const legendH = 8;
  const maxLegendVal = showDose && exposureMinutes > 0
    ? computeDoseMJcm2(Math.max(heatmapStats.max, 1), exposureMinutes)
    : Math.max(heatmapStats.max, 1);
  const legendUnit = showDose && exposureMinutes > 0 ? 'mJ/cm²' : 'mW/m²';

  const legendSegments = 20;
  const legendRects = useMemo(() => {
    const rects: React.ReactNode[] = [];
    for (let i = 0; i < legendSegments; i++) {
      const t = i / legendSegments;
      rects.push(
        <Rect
          key={`leg-${i}`}
          x={legendX + (legendWidth * i) / legendSegments}
          y={legendY}
          width={legendWidth / legendSegments + 1}
          height={legendH}
          fill={interpolateGradient(t)}
          rx={i === 0 ? 3 : i === legendSegments - 1 ? 3 : 0}
        />,
      );
    }
    return rects;
  }, [legendX, legendWidth, legendY, legendH]);

  return (
    <View ref={svgRef} {...(Platform.OS === 'web' ? { style: { touchAction: 'none' } as any } : {})}>
      <Svg width={svgWidth} height={svgHeight + 28} viewBox={`0 0 ${svgWidth} ${svgHeight + 28}`}>
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

        {gridLines}
        {renderAxisLabels(spanX, spanY, isHorizontalSurface, svgHeight, drawWidth, drawHeight, colors)}

        <SvgText x={svgWidth / 2} y={SVG_PADDING - 6} textAnchor="middle" fontSize="8" fill={colors.textTertiary}>
          {isHorizontalSurface ? `Width: ${roomWidth.toFixed(1)} ${unitLabel}` : `${spanX.toFixed(1)} ${unitLabel}`}
        </SvgText>

        {heatmapRects}

        {beamData.map((beam, index) => {
          const sourcePoint = {
            x: beam.xPos,
            z: beam.zPos,
            y: isHorizontalSurface ? (surfaceMode === 'ceiling' ? roomHeight : 0) : Math.min(roomHeight, Math.max(0, beam.verticalHeight)),
          };
          const center = projectSurfacePoint(sourcePoint);
          const beamWidthWorld = isSideWall ? beam.beamDiamV : beam.beamDiamH;
          const beamHeightWorld = isHorizontalSurface ? beam.beamDiamV : Math.min(roomHeight, Math.max(0.8, beam.beamDiamV));
          const tiltShiftX = beam.tiltAngle > 0 ? Math.sin((beam.tiltAngle * Math.PI) / 180) * beam.verticalHeight * 0.3 : 0;
          const tiltStretch = beam.tiltAngle > 0 ? 1 + Math.sin((beam.tiltAngle * Math.PI) / 180) * 0.5 : 1;
          const radiusX = Math.max((beamWidthWorld / spanX) * (drawWidth / 2) * tiltStretch, 8);
          const radiusY = Math.max((beamHeightWorld / spanY) * (drawHeight / 2), 8);
          const isSelected = activeSelectionId === beam.id;
          const shiftPx = isHorizontalSurface ? (tiltShiftX / spanX) * drawWidth : 0;

          return (
            <G key={`beam-${beam.id}`}>
              <Ellipse cx={center.x + shiftPx} cy={center.y} rx={radiusX} ry={radiusY} fill={`url(#beam-grad-${index})`} opacity={isSelected ? 0.82 : 0.5} />
              <Ellipse cx={center.x + shiftPx} cy={center.y} rx={radiusX} ry={radiusY} fill="none" stroke={beam.color} strokeWidth={isSelected ? 2.5 : 1.5} strokeDasharray="4,3" />
            </G>
          );
        })}

        {beamData.map((beam) => {
          const center = projectSurfacePoint({
            x: beam.xPos,
            z: beam.zPos,
            y: isHorizontalSurface ? (surfaceMode === 'ceiling' ? roomHeight : 0) : Math.min(roomHeight, Math.max(0, beam.verticalHeight)),
          });
          const handlers = getFixtureHandlers(beam.id);
          const isSelected = activeSelectionId === beam.id;
          const isDragging = draggingId === beam.id;

          return (
            <G key={`fixture-${beam.id}`} {...(Platform.OS !== 'web' ? handlers : {})}>
              {isDragging && isHorizontalSurface && (
                <Circle cx={center.x} cy={center.y} r={16} fill={beam.color} opacity={0.15} />
              )}
              <Circle cx={center.x} cy={center.y} r={isSelected ? 11 : 9} fill={colors.surface} stroke={beam.color} strokeWidth={3} />
              <Circle cx={center.x} cy={center.y} r={4} fill={beam.color} />
              {beam.tiltAngle > 0 && isHorizontalSurface && (
                <G>
                  <Line
                    x1={center.x}
                    y1={center.y}
                    x2={center.x + Math.sin((beam.tiltAngle * Math.PI) / 180) * 14}
                    y2={center.y}
                    stroke={beam.color}
                    strokeWidth={2}
                    opacity={0.7}
                  />
                  <Polygon
                    points={`${center.x + Math.sin((beam.tiltAngle * Math.PI) / 180) * 14},${center.y - 3} ${center.x + Math.sin((beam.tiltAngle * Math.PI) / 180) * 14},${center.y + 3} ${center.x + Math.sin((beam.tiltAngle * Math.PI) / 180) * 18},${center.y}`}
                    fill={beam.color}
                    opacity={0.7}
                  />
                </G>
              )}
              <SvgText x={center.x} y={center.y - 18} textAnchor="middle" fontSize="8" fontWeight="700" fill={beam.color}>
                {beam.model}
              </SvgText>
              {isHorizontalSurface && (
                <SvgText x={center.x} y={center.y + 22} textAnchor="middle" fontSize="7" fill={colors.textTertiary}>
                  {beam.xPos.toFixed(1)}, {beam.zPos.toFixed(1)}{beam.tiltAngle > 0 ? ` · ${beam.tiltAngle}°` : ''}
                </SvgText>
              )}
            </G>
          );
        })}

        {!isHorizontalSurface && (
          <SvgText x={SVG_PADDING + 8} y={SVG_PADDING + 14} fontSize="9" fontWeight="700" fill={colors.textSecondary}>
            Elevation View ({surfaceMode === 'backWall' ? 'Back Wall' : surfaceMode === 'leftWall' ? 'Left Wall' : 'Right Wall'})
          </SvgText>
        )}

        {showHeatmap && heatmapStats.max > 0 && (
          <G>
            {legendRects}
            <SvgText x={legendX} y={legendY + legendH + 10} fontSize="7" fill={colors.textTertiary} textAnchor="start">
              0
            </SvgText>
            <SvgText x={legendX + legendWidth / 2} y={legendY + legendH + 10} fontSize="7" fill={colors.textTertiary} textAnchor="middle">
              {(maxLegendVal / 2).toFixed(0)} {legendUnit}
            </SvgText>
            <SvgText x={legendX + legendWidth} y={legendY + legendH + 10} fontSize="7" fill={colors.textTertiary} textAnchor="end">
              {maxLegendVal.toFixed(0)}
            </SvgText>
          </G>
        )}
      </Svg>

      {Platform.OS === 'web' && isHorizontalSurface &&
        beamData.map((beam) => {
          const center = projectSurfacePoint({
            x: beam.xPos,
            z: beam.zPos,
            y: surfaceMode === 'ceiling' ? roomHeight : 0,
          });
          return (
            <View
              key={`web-handle-${beam.id}`}
              onPointerDown={(e: any) => handleWebPointerDown(beam.id, e)}
              style={{
                position: 'absolute',
                left: center.x - 14,
                top: center.y - 14,
                width: 28,
                height: 28,
                borderRadius: 14,
                cursor: draggingId === beam.id ? 'grabbing' : 'grab',
                zIndex: 10,
              } as any}
            />
          );
        })}
    </View>
  );
});

TopView.displayName = 'TopView';
