import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { makeStyles } from './styles';

interface ChevronProps {
  progress: Animated.SharedValue<number>;
}

export const Chevron = ({ progress }: ChevronProps) => {
  const { colors } = useTheme();
  const styles = makeStyles();
  const style = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${interpolate(progress.value, [0, 1], [0, Math.PI])}rad` },
    ],
  }));
  return (
    <Animated.View style={[styles.container, style]}>
      <Svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round">
        <Path d="M6 9l6 6 6-6" />
      </Svg>
    </Animated.View>
  );
};
