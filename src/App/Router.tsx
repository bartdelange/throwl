import {
  GAME_DETAIL_SCREEN,
  HOME_SCREEN,
  NEW_GAME_SCREEN,
  PLAY_GAME_SCREEN,
  PLAYED_GAMES_SCREEN,
  RootStackParamList,
  UNAUTHENTICATED_SCREEN,
} from '#/navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AppBar } from '~/components/AppBar/AppBar';
import { AuthContext } from '~/context/AuthContext';
import { GameDetailScreen } from '~/screens/GameDetail/GameDetail';
import { HomeScreen } from '~/screens/Home/Home';
import { NewGameScreen } from '~/screens/NewGame/NewGame';
import { PlayedGamesScreen } from '~/screens/PlayedGames/PlayedGames';
import { PlayGameScreen } from '~/screens/PlayGame/PlayGame';
import { UnauthenticatedScreen } from '~/screens/Unauthenticated/Unauthenticated';

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
      <Stack.Screen name={PLAYED_GAMES_SCREEN} component={PlayedGamesScreen} />
      <Stack.Screen
        name={GAME_DETAIL_SCREEN}
        component={GameDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
