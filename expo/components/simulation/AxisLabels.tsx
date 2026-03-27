import React from 'react';
import { Text as SvgText } from 'react-native-svg';
import { ThemeColors } from '@/constants/theme';
import { SVG_PADDING } from './types';

export function renderAxisLabels(
  spanX: number,
  spanY: number,
  isHoriz: boolean,
  svgHeight: number,
  drawWidth: number,
  drawHeight: number,
  colors: ThemeColors,
): React.ReactNode[] {
  const labels: React.ReactNode[] = [];
  const xSteps = Math.min(5, Math.floor(spanX));
  const ySteps = Math.min(5, Math.floor(spanY));

  for (let i = 0; i <= xSteps; i++) {
    const val = (spanX * i) / xSteps;
    const px = SVG_PADDING + (val / spanX) * drawWidth;
    labels.push(
      <SvgText key={`ax-${i}`} x={px} y={svgHeight - 2} textAnchor="middle" fontSize="7" fill={colors.textTertiary}>
        {val.toFixed(val >= 10 ? 0 : 1)}
      </SvgText>,
    );
  }

  for (let i = 0; i <= ySteps; i++) {
    const val = (spanY * i) / ySteps;
    const py = isHoriz
      ? SVG_PADDING + (val / spanY) * drawHeight
      : SVG_PADDING + ((spanY - val) / spanY) * drawHeight;
    labels.push(
      <SvgText key={`ay-${i}`} x={SVG_PADDING - 4} y={py + 3} textAnchor="end" fontSize="7" fill={colors.textTertiary}>
        {val.toFixed(val >= 10 ? 0 : 1)}
      </SvgText>,
    );
  }

  return labels;
}
