import React, { RefObject } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { RectButton } from 'react-native-gesture-handler';

import { default as RNGHSwipeable } from 'react-native-gesture-handler/Swipeable';
import { IconButton } from 'react-native-paper';

export interface SwipeableProps {
  rightActions?: {
    icon: string;
    backgroundColor?: string;
    iconColor?: string;
    onPress?: (pointerInside: boolean) => void;
  }[];
  bounce?: boolean;
}

export const Swipeable: React.FC<React.PropsWithChildren<SwipeableProps>> = ({
  children,
  rightActions = [],
  bounce,
}) => {
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation,
    dragX: Animated.AnimatedInterpolation
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-(rightActions.length * 60), 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={[styles.rightAction]}>
        {rightActions.map((action, i) => (
          <View
            key={i}
            style={[
              styles.actionIcon,
              { backgroundColor: action.backgroundColor || 'red' },
            ]}>
            <Animated.View style={[{ transform: [{ scale }] }]}>
              <RectButton onPress={action.onPress}>
                <IconButton
                  icon={action.icon}
                  color={action.iconColor || 'white'}
                />
              </RectButton>
            </Animated.View>
          </View>
        ))}
      </View>
    );
  };

  const swipeableRow = React.useRef<RNGHSwipeable>();

  const styles = StyleSheet.create({
    actionIcon: {
      flex: 1,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      height: '100%',
    },
    rightAction: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      width: rightActions.length * 60,
      height: '100%',
    },
  });

  React.useEffect(() => {
    if (bounce) {
      setTimeout(() => {
        swipeableRow.current?.openRight();
        setTimeout(() => {
          swipeableRow.current?.close();
        }, 1500);
      }, 500);
    }
  });

  return (
    <RNGHSwipeable
      ref={swipeableRow as RefObject<RNGHSwipeable>}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={30}
      useNativeAnimations
      renderRightActions={renderRightActions}>
      {children}
    </RNGHSwipeable>
  );
};
