import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PanResponder, View } from 'react-native';
import { Animated } from 'react-native';

import { parts } from './constants/parts';
import { numberParts } from './constants/numbers';
import { useTheme } from 'react-native-paper';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type DartboardScoreType =
  | 'single'
  | 'double'
  | 'triple'
  | 'bull'
  | 'out';

export interface ClickablePart {
  score: number;
  type: DartboardScoreType;
  svgPath: string;
  color: string;
}

interface ClickableDartboardProps {
  onClick?: (
    part: Pick<ClickablePart, 'type' | 'score'>,
    pagePos: { x: number; y: number }
  ) => void;
}
export const ClickableDartboard: React.FC<ClickableDartboardProps> = ({
  onClick,
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
        return (
          <Path
            key={`${part.type}-${part.score}`}
            d={part.svgPath}
            fill={part.color}
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
