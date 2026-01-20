import React, { FC } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameModeScreen } from './GameMode/GameMode';
import { GameOptionsScreen } from './GameOptions/GameOptions';
import { PlayerSelectScreen } from './PlayerSelect/PlayerSelect';
import { NewGameProvider } from '../../context/NewGameContext';
import { AppBar } from '../../components/AppBar/AppBar';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/core';
import { RootStackParamList } from '@throwl/shared-constants';

export enum GameFlowStackNames {
  GAME_MODE = 'GameMode',
  GAME_OPTIONS = 'GameOptions',
  PLAYER_SELECT = 'PlayerSelect',
}
export type StepperParamList = {
  [GameFlowStackNames.GAME_MODE]: undefined;
  [GameFlowStackNames.GAME_OPTIONS]: undefined;
  [GameFlowStackNames.PLAYER_SELECT]:
    | {
        selectedUsers?: string[];
        guestUsers?: string[];
      }
    | undefined;
};
const StepStack = createNativeStackNavigator<StepperParamList>();

export const NewGameScreen: FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'NEW_GAME'>>();
  const gameOptions = route.params?.gameOptions;

  return (
    <NewGameProvider
      initialState={{ options: gameOptions, mode: gameOptions?.mode }}
    >
      <StepStack.Navigator
        screenOptions={{
          header: (props) => <AppBar {...props} />,
        }}
      >
        <StepStack.Screen
          name={GameFlowStackNames.GAME_MODE}
          component={GameModeScreen}
        />
        <StepStack.Screen
          name={GameFlowStackNames.GAME_OPTIONS}
          component={GameOptionsScreen}
        />
        <StepStack.Screen
          name={GameFlowStackNames.PLAYER_SELECT}
          component={PlayerSelectScreen}
          initialParams={{
            selectedUsers: route.params?.selectedUsers,
            guestUsers: route.params?.guestUsers,
          }}
        />
      </StepStack.Navigator>
    </NewGameProvider>
  );
};
