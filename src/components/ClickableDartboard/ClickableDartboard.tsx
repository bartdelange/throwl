import React from 'react';
import interpolateColor from 'color-interpolate';
import Svg, { Path, Rect } from 'react-native-svg';
import { DartboardScoreType, Throw } from '~/models/throw';
import { numberParts } from './constants/numbers';

import { parts } from './constants/parts';

export interface ClickablePart extends Throw {
  svgPath: string;
  color: string;
}

interface ClickableDartboardProps {
  onClick?: (score: Throw, pagePos: { x: number; y: number }) => void;
  heatmap?: Map<string, number>;
}

export const ClickableDartboard: React.FC<ClickableDartboardProps> = ({
  onClick,
  heatmap,
}) => {
  const [currentlySelected, setCurrentlySelected] =
    React.useState<ClickablePart>();

  return (
    <Svg viewBox="0 0 500 500" preserveAspectRatio="none">
      {numberParts.map((part, i) => (
        <Path key={i} d={part.svgPath} fill={part.color} />
      ))}
      {parts.map((part, i) => {
        let partColor = part.color;
        if (heatmap && heatmap.has(`${part.type}/${part.score}`)) {
          const percentage = heatmap.get(`${part.type}/${part.score}`) || 0;
          const colorMap = interpolateColor(['#80deea', '#0d47a1']);
          partColor = colorMap(percentage);
        }

        return (
          <Path
            key={`${i}-${part.type}-${part.score}`}
            d={part.svgPath}
            fill={partColor}
            onPressIn={() => {
              setCurrentlySelected(part);
            }}
            onPressOut={evt => {
              if (currentlySelected) {
                const { svgPath, color, ...clickRest } = currentlySelected;
                onClick &&
                  onClick(clickRest, {
                    x: evt.nativeEvent.pageX,
                    y: evt.nativeEvent.pageY,
                  });
                setCurrentlySelected(undefined);
              }
            }}
          />
        );
      })}
      {currentlySelected && (
        <Path
          d={currentlySelected.svgPath}
          stroke={currentlySelected.color}
          fill={currentlySelected.color}
          strokeWidth={20}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
};
