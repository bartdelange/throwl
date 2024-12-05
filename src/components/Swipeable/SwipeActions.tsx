import React, { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

import { RectButton } from 'react-native-gesture-handler';

import {
    default as RNGHSwipeable,
    SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Reanimated, {
    SharedValue,
    interpolate,
    Extrapolation,
    useAnimatedStyle,
} from 'react-native-reanimated';

export interface SwipeableProps {
    rightActions?: {
        icon: string;
        backgroundColor?: string;
        iconColor?: string;
        onPress?: (pointerInside: boolean) => void;
    }[];
    bounce?: boolean;
}

export const SwipeActions: React.FC<
    React.PropsWithChildren<SwipeableProps>
> = ({ children, rightActions = [], bounce }) => {
    const [elemWidth, setElemWidth] = React.useState<number>(0);
    const renderRightActions = (
        _progress: SharedValue<number>,
        drag: SharedValue<number>
    ) => {
        const animatedStyle = useAnimatedStyle(() => ({
            transform: [
                {
                    scale: interpolate(
                        drag.value,
                        [-(rightActions.length * elemWidth), 0],
                        [1, 0],
                        Extrapolation.CLAMP
                    ),
                },
            ],
        }));

        return (
            <View style={[styles.rightAction]}>
                {rightActions.map((action, i) => (
                    <View
                        onLayout={event => {
                            setElemWidth(event.nativeEvent.layout.height);
                        }}
                        key={i}
                        style={[
                            styles.actionIconWrapper,
                            {
                                backgroundColor:
                                    action.backgroundColor || 'red',
                                width: elemWidth,
                            },
                        ]}>
                        <RectButton
                            onPress={action.onPress}
                            style={styles.actionIcon}>
                            <Reanimated.View style={animatedStyle}>
                                <MaterialCommunityIcons
                                    name={action.icon}
                                    adjustsFontSizeToFit
                                    style={{ fontSize: 100 }}
                                    color={action.iconColor || 'white'}
                                />
                            </Reanimated.View>
                        </RectButton>
                    </View>
                ))}
            </View>
        );
    };

    const swipeableRow = React.useRef<SwipeableMethods>();

    const styles = StyleSheet.create({
        actionIconWrapper: {
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
            ref={swipeableRow as RefObject<SwipeableMethods>}
            friction={2}
            enableTrackpadTwoFingerGesture
            rightThreshold={30}
            renderRightActions={renderRightActions}>
            {children}
        </RNGHSwipeable>
    );
};
