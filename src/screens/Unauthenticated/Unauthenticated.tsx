import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { JSX } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { Divider, IconButton } from 'react-native-paper';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { SignInTab } from '~/screens/Unauthenticated/tabs/SignIn';
import { makeStyles } from './styles';
import { SignUpTab } from './tabs/SignUp';

const Tab = createMaterialTopTabNavigator();

export const UnauthenticatedScreen = () => {
    const { width } = Dimensions.get('window');
    const styles = makeStyles();
    const tabicons = { SIGN_IN: 'login-variant', SIGN_UP: 'account-plus' };

    return (
        <FullScreenLayout>
            <Tab.Navigator
                tabBar={({ state, descriptors, navigation, position }) => {
                    const buttons: JSX.Element[] = state.routes
                        .filter(route => !!route)
                        .map((route, index) => {
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            const inputRange = state.routes.map((_, i) => i);
                            const opacity = position.interpolate({
                                inputRange,
                                outputRange: inputRange.map(i =>
                                    i === index ? 1 : 0.25
                                ),
                            });

                            return (
                                <Animated.View
                                    style={{ opacity }}
                                    key={route.name}>
                                    <IconButton
                                        icon={
                                            tabicons[
                                                route.name as unknown as
                                                    | 'SIGN_UP'
                                                    | 'SIGN_IN'
                                            ]
                                        }
                                        iconColor={'white'}
                                        size={Math.max(width * 0.1, 24)}
                                        style={styles.tabIcon}
                                        onPress={onPress}
                                        onLongPress={onLongPress}
                                    />
                                </Animated.View>
                            );
                        });

                    const dividedButtons = buttons.reduce(
                        (r, button) =>
                            r.concat(
                                button,
                                <Divider
                                    key="divider"
                                    style={{
                                        width: Math.max(width * 0.005, 2),
                                        height: '100%',
                                        backgroundColor: 'white',
                                    }}
                                />
                            ),
                        [<View />]
                    );
                    dividedButtons.shift();
                    dividedButtons.pop();

                    return <View style={styles.tabBar}>{dividedButtons}</View>;
                }}>
                <Tab.Screen name="SIGN_UP" component={SignUpTab} />
                <Tab.Screen name="SIGN_IN" component={SignInTab} />
            </Tab.Navigator>
        </FullScreenLayout>
    );
};
