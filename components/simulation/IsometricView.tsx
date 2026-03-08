import React from 'react';
import Svg, { Rect, Ellipse, Line, G, Circle, Text as SvgText } from 'react-native-svg';
import { ThemeColors } from '@/constants/theme';
import { FixtureBeamData, SVG_PADDING, SurfaceMode } from './types';

interface IsometricViewProps {
  beamData: FixtureBeamData[];
  svgWidth: number;
  svgHeight: number;
  drawWidth: number;
  drawHeight: number;
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  unitLabel: string;
  surfaceMode: SurfaceMode;
  activeSelectionId: string | null;
  colors: ThemeColors;
}

export const IsometricView = React.memo(({
  beamData,
  svgWidth,
  svgHeight,
  drawWidth,
  drawHeight,
  roomWidth,
  roomDepth,
  roomHeight,
  unitLabel,
  surfaceMode,
  activeSelectionId,
  colors,
}: IsometricViewProps) => {
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

      <SvgText x={corners.floorFrontLeft.x} y={corners.floorFrontLeft.y + 12} textAnchor="middle" fontSize="7" fill={colors.textTertiary}>
        {roomDepth.toFixed(1)}{unitLabel}
      </SvgText>
      <SvgText x={(corners.floorFrontLeft.x + corners.floorFrontRight.x) / 2} y={(corners.floorFrontLeft.y + corners.floorFrontRight.y) / 2 + 12} textAnchor="middle" fontSize="7" fill={colors.textTertiary}>
        {roomWidth.toFixed(1)}{unitLabel}
      </SvgText>

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
            <SvgText x={fixture.x + 7} y={fixture.y - 6} fontSize="8" fill={colors.textSecondary}>
              {beam.model}
            </SvgText>
          </G>
        );
      })}

      <SvgText x={SVG_PADDING + 8} y={SVG_PADDING + 14} fontSize="9" fontWeight="700" fill={colors.textSecondary}>
        3D Overview · {surfaceMode === 'floor' ? 'Floor Focus' : surfaceMode === 'ceiling' ? 'Ceiling Focus' : 'Wall Focus'}
      </SvgText>
    </Svg>
  );
});

IsometricView.displayName = 'IsometricView';
