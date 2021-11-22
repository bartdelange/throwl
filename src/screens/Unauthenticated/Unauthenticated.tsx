import React from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SignUpTab } from './tabs/SignUp';
import { SignInTab } from '~/screens/Unauthenticated/tabs/SignIn';
import { Divider, IconButton } from 'react-native-paper';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { makeStyles } from './styles';

const Tab = createMaterialTopTabNavigator();

export const UnauthenticatedScreen = () => {
  const { width } = Dimensions.get('window');
  const styles = makeStyles();
  const tabicons = { SIGN_IN: 'login-variant', SIGN_UP: 'account-plus' };

  return (
    <FullScreenLayout>
      <KeyboardAwareScrollView
        resetScrollToCoords={{ x: 0, y: 0 }}
        contentContainerStyle={styles.layout}
        scrollEnabled={true}>
        <Tab.Navigator
          tabBar={({ state, descriptors, navigation, position }) => {
            const buttons = state.routes.map((route, index) => {
              if (!route) return;
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
                outputRange: inputRange.map(i => (i === index ? 1 : 0.25)),
              });

              return (
                <Animated.View style={{ opacity }} key={route.name}>
                  <IconButton
                    icon={
                      tabicons[route.name as unknown as 'SIGN_UP' | 'SIGN_IN']
                    }
                    color={'white'}
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
      </KeyboardAwareScrollView>
    </FullScreenLayout>
  );
};
