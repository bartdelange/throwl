import React, { FC, useState } from 'react';
import interpolateColor from 'color-interpolate';
import Svg, { Path } from 'react-native-svg';
import { Throw } from '@throwl/shared-domain-models';
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

export const ClickableDartboard: FC<ClickableDartboardProps> = ({
  onClick,
  heatmap,
}) => {
  const [currentlySelected, setCurrentlySelected] = useState<ClickablePart>();

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
            onPressOut={(evt) => {
              if (currentlySelected) {
                const { svgPath: _svgPath, color: _color, ...clickRest } = part;

                if (onClick) {
                  onClick(clickRest, {
                    x: evt.nativeEvent.pageX,
                    y: evt.nativeEvent.pageY,
                  });
                }

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
