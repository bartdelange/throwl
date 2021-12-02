import React, { RefObject } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { RectButton } from 'react-native-gesture-handler';

import { default as RNGHSwipeable } from 'react-native-gesture-handler/Swipeable';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const [elemWidth, setElemWidth] = React.useState<number>(0);
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation,
    dragX: Animated.AnimatedInterpolation
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-(rightActions.length * elemWidth), 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={[styles.rightAction]}>
        {rightActions.map((action, i) => (
          <View
            onLayout={event => {
              setElemWidth(event.nativeEvent.layout.width);
            }}
            key={i}
            style={[
              styles.actionIconWrapper,
              { backgroundColor: action.backgroundColor || 'red' },
            ]}>
            <RectButton onPress={action.onPress} style={styles.actionIcon}>
              <Animated.View style={[{ transform: [{ scale }] }]}>
                <MaterialCommunityIcons
                  name={action.icon}
                  adjustsFontSizeToFit
                  style={{ fontSize: 1000 }}
                  color={action.iconColor || 'white'}
                />
              </Animated.View>
            </RectButton>
          </View>
        ))}
      </View>
    );
  };

  const swipeableRow = React.useRef<RNGHSwipeable>();

  const styles = StyleSheet.create({
    actionIconWrapper: {
      flex: 1,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      height: '100%',
    },
    actionIcon: {
      padding: '25%',
    },
    rightAction: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      aspectRatio: 1,
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
  }, []);

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
