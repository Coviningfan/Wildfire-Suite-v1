import React from 'react';
import Svg, { Rect, Ellipse, Line, Defs, RadialGradient, Stop, G, Circle, Text as SvgText } from 'react-native-svg';
import { ThemeColors } from '@/constants/theme';
import { FixtureBeamData, SVG_PADDING, getSafetyColor } from './types';
import { renderAxisLabels } from './AxisLabels';

interface SideViewProps {
  beamData: FixtureBeamData[];
  svgWidth: number;
  svgHeight: number;
  drawWidth: number;
  drawHeight: number;
  roomWidth: number;
  roomHeight: number;
  unitLabel: string;
  activeSelectionId: string | null;
  colors: ThemeColors;
}

export const SideView = React.memo(({
  beamData,
  svgWidth,
  svgHeight,
  drawWidth,
  drawHeight,
  roomWidth,
  roomHeight,
  unitLabel,
  activeSelectionId,
  colors,
}: SideViewProps) => {
  const toSvgX = (worldX: number) => SVG_PADDING + (worldX / roomWidth) * drawWidth;
  const toSvgY = (worldY: number) => roomHeight > 0 ? SVG_PADDING + ((roomHeight - worldY) / roomHeight) * drawHeight : SVG_PADDING + drawHeight;
  const scaleX = (distance: number) => (distance / roomWidth) * drawWidth;

  return (
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

      {renderAxisLabels(roomWidth, roomHeight, false, svgHeight, drawWidth, drawHeight, colors)}

      {beamData.map((beam, index) => {
        const fixtureX = toSvgX(beam.xPos);
        const mountHeight = Math.min(beam.verticalHeight, roomHeight);
        const fixtureY = toSvgY(mountHeight);
        const floorY = SVG_PADDING + drawHeight;
        const beamHalfW = Math.max(scaleX(beam.beamDiamH / 2), 8);
        const beamSpreadY = Math.max(floorY - fixtureY, 10);
        const isSelected = activeSelectionId === beam.id;

        const tiltShiftPx = beam.tiltAngle > 0
          ? Math.sin((beam.tiltAngle * Math.PI) / 180) * beamSpreadY * 0.4
          : 0;

        return (
          <G key={`side-${beam.id}`}>
            <Line x1={fixtureX} y1={fixtureY} x2={fixtureX - beamHalfW + tiltShiftPx} y2={floorY} stroke={beam.color} strokeWidth={1} opacity={0.5} strokeDasharray="4,3" />
            <Line x1={fixtureX} y1={fixtureY} x2={fixtureX + beamHalfW + tiltShiftPx} y2={floorY} stroke={beam.color} strokeWidth={1} opacity={0.5} strokeDasharray="4,3" />
            <Ellipse cx={fixtureX + tiltShiftPx / 2} cy={fixtureY + beamSpreadY / 2} rx={beamHalfW / 2} ry={beamSpreadY / 2} fill={`url(#side-grad-${index})`} opacity={isSelected ? 0.9 : 0.7} />
            <Line x1={fixtureX - beamHalfW + tiltShiftPx} y1={floorY} x2={fixtureX + beamHalfW + tiltShiftPx} y2={floorY} stroke={getSafetyColor(beam.irradiance)} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
            <Line x1={fixtureX} y1={SVG_PADDING} x2={fixtureX} y2={fixtureY} stroke={colors.border} strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
            <Circle cx={fixtureX} cy={fixtureY} r={6} fill={colors.surface} stroke={beam.color} strokeWidth={isSelected ? 2 : 1.5} />
            <Circle cx={fixtureX} cy={fixtureY} r={2.5} fill={beam.color} />
            {beam.tiltAngle > 0 && (
              <SvgText x={fixtureX - 14} y={fixtureY + 4} fontSize="7" fill={colors.textTertiary} textAnchor="end">
                {beam.tiltAngle}°
              </SvgText>
            )}
            <SvgText x={fixtureX} y={fixtureY - 10} textAnchor="middle" fontSize="8" fill={beam.color} fontWeight="600">
              {beam.model}
            </SvgText>
            <SvgText x={fixtureX + 12} y={fixtureY + 4} fontSize="7" fill={colors.textTertiary}>
              {mountHeight.toFixed(1)}{unitLabel}
            </SvgText>
          </G>
        );
      })}

      <SvgText x={SVG_PADDING + 8} y={SVG_PADDING + 14} fontSize="9" fontWeight="700" fill={colors.textSecondary}>
        Side View
      </SvgText>
      <SvgText x={svgWidth / 2} y={svgHeight - 4} textAnchor="middle" fontSize="9" fill={colors.textTertiary}>
        {roomWidth.toFixed(1)} {unitLabel} width × {roomHeight.toFixed(1)} {unitLabel} height
      </SvgText>
    </Svg>
  );
});

SideView.displayName = 'SideView';
