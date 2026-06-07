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
} from '@throwl/shared-constants';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppBar } from '@throwl/shared-ui';
import { useAuthContext, UnauthenticatedScreen } from '@throwl/feature-auth';
import {
  NormalGameDetailScreen,
  NormalGameScreen,
} from '@throwl/feature-game-x01';
import { HomeScreen } from '@throwl/feature-home';
import { NewGameScreen } from '@throwl/feature-new-game';
import { PlayedGamesScreen } from '@throwl/feature-played-games';
import { ProfileScreen } from '@throwl/feature-profile';
import { FriendsScreen } from '@throwl/feature-friends';
import {
  DoublesGameScreen,
  DoublesGameDetailScreen,
} from '@throwl/feature-game-doubles';

export const Router = () => {
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const { user, logout } = useAuthContext();

  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => (
          <AppBar
            {...props}
            onFriendsPress={() => props.navigation.push(FRIENDS_SCREEN)}
            onSettingsPress={() => props.navigation.push(PROFILE_SCREEN)}
            onSignOut={() => {
              void logout();
            }}
          />
        ),
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
