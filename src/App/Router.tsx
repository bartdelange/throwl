import React from 'react';
import {
  HOME_SCREEN,
  UNAUTHENTICATED_SCREEN,
  RootStackParamList,
  NEW_GAME_SCREEN,
  PLAY_GAME_SCREEN,
} from '#/navigation';
import { UnauthenticatedScreen } from '~/screens/Unauthenticated/Unauthenticated';
import { HomeScreen } from '~/screens/Home/Home';
import { AuthContext } from '~/context/AuthContext';
import { AppBar } from '~/components/AppBar/AppBar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NewGameScreen } from '~/screens/NewGame/NewGame';
import { PlayGameScreen } from '~/screens/PlayGame/PlayGame';

export const Router = () => {
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const { user } = React.useContext(AuthContext);

  return (
    <Stack.Navigator
      screenOptions={{
        header: props => <AppBar {...props} />,
      }}
      initialRouteName={user && 'HOME'}>
      <Stack.Screen
        name={UNAUTHENTICATED_SCREEN}
        component={UnauthenticatedScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name={HOME_SCREEN} component={HomeScreen} />
      <Stack.Screen name={NEW_GAME_SCREEN} component={NewGameScreen} />
      <Stack.Screen
        name={PLAY_GAME_SCREEN}
        component={PlayGameScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
