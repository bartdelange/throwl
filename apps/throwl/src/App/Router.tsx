import {
  DOUBLES_GAME_DETAIL_SCREEN,
  DOUBLES_GAME_SCREEN,
  FRIENDS_SCREEN,
  HOME_SCREEN,
  NEW_GAME_SCREEN,
  NORMAL_GAME_DETAIL_SCREEN,
  NORMAL_GAME_SCREEN,
  PLAYED_GAMES_SCREEN,
  PROFILE_SCREEN,
  RootStackParamList,
  UNAUTHENTICATED_SCREEN,
} from '../constants/navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AppBar } from '../components/AppBar/AppBar';
import { useAuthContext } from '../context/AuthContext';
import { NormalGameDetailScreen } from '../screens/NormalMatch/NormalGameDetail/NormalGameDetail';
import { HomeScreen } from '../screens/Home/Home';
import { NewGameScreen } from '../screens/NewGame/NewGame';
import PlayedGamesScreen from '../screens/PlayedGames/PlayedGames';
import { NormalGameScreen } from '../screens/NormalMatch/NormalGame/NormalGame';
import { UnauthenticatedScreen } from '../screens/Unauthenticated/Unauthenticated';
import { ProfileScreen } from '../screens/Profile/Profile';
import FriendsScreen from '../screens/Friends/Friends';
import { DoublesGameScreen } from '../screens/DoublesMatch/DoublesGame/DoublesGame';
import { DoublesGameDetailScreen } from '../screens/DoublesMatch/DoublesGameDetail/DoublesGameDetail';

export const Router = () => {
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const { user } = useAuthContext();

  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <AppBar {...props} />,
      }}
      initialRouteName={user && 'HOME'}
    >
      <Stack.Screen
        name={UNAUTHENTICATED_SCREEN}
        component={UnauthenticatedScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name={HOME_SCREEN} component={HomeScreen} />
      <Stack.Screen name={PROFILE_SCREEN} component={ProfileScreen} />
      <Stack.Screen name={FRIENDS_SCREEN} component={FriendsScreen} />
      <Stack.Screen
        name={NEW_GAME_SCREEN}
        component={NewGameScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NORMAL_GAME_SCREEN}
        component={NormalGameScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NORMAL_GAME_DETAIL_SCREEN}
        component={NormalGameDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={DOUBLES_GAME_SCREEN}
        component={DoublesGameScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={DOUBLES_GAME_DETAIL_SCREEN}
        component={DoublesGameDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name={PLAYED_GAMES_SCREEN} component={PlayedGamesScreen} />
    </Stack.Navigator>
  );
};
