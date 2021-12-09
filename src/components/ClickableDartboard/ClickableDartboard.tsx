import React from 'react';
import { PanResponder } from 'react-native';
import { useTheme } from 'react-native-paper';
import interpolateColor from 'color-interpolate';
import Svg, { Path } from 'react-native-svg';
import { Throw } from '~/models/throw';
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
  const { colors } = useTheme();

  const isCurrentlySelected = (part: ClickablePart) => {
    return (
      currentlySelected &&
      currentlySelected.score === part.score &&
      currentlySelected.type === part.type
    );
  };
  return (
    <Svg viewBox="0 0 6946 6946">
      {parts.map(part => {
        const responder = PanResponder.create({
          onStartShouldSetPanResponder: (evt, gestureState) => true,
          onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
          onMoveShouldSetPanResponder: (evt, gestureState) => true,
          onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

          onPanResponderGrant: (evt, gestureState) => {
            setCurrentlySelected(part);
          },
          onPanResponderMove: (evt, gestureState) => {
            setCurrentlySelected(part);
          },
          onPanResponderTerminationRequest: (evt, gestureState) => true,
          onPanResponderRelease: (evt, gestureState) => {
            if (currentlySelected) {
              const { svgPath, color, ...clickRest } = currentlySelected;
              onClick &&
                onClick(clickRest, {
                  x: evt.nativeEvent.pageX,
                  y: evt.nativeEvent.pageY,
                });
              setCurrentlySelected(undefined);
            }
          },
          onPanResponderTerminate: (evt, gestureState) => {
            setCurrentlySelected(undefined);
          },
        });

        let partColor = part.color;
        if (heatmap && heatmap.has(`${part.type}/${part.score}`)) {
          const percentage = heatmap.get(`${part.type}/${part.score}`) || 0;
          const colorMap = interpolateColor(['#80deea', '#0d47a1']);
          partColor = colorMap(percentage);
        }

        return (
          <Path
            key={`${part.type}-${part.score}`}
            d={part.svgPath}
            fill={partColor}
            stroke={isCurrentlySelected(part) ? colors.primary : ''}
            strokeWidth={isCurrentlySelected(part) ? 50 : 0}
            {...responder.panHandlers}
          />
        );
      })}
      {numberParts.map((part, i) => (
        <Path key={i} d={part.svgPath} fill={part.color} />
      ))}
      {currentlySelected && (
        <Path
          d={currentlySelected.svgPath}
          stroke={currentlySelected.color}
          fill={currentlySelected.color}
          strokeWidth={250}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
};
