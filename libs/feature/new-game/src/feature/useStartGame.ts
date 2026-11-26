import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  DOUBLES_GAME_SCREEN,
  NORMAL_GAME_SCREEN,
  RootStackParamList,
  SerializablePlayer,
} from '@throwl/shared-constants';
import { TeamRoster } from '@throwl/shared-domain-models';
import { useNewGame } from './NewGameContext';

export function useStartGame() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    state: { options },
  } = useNewGame();

  return (players: SerializablePlayer[], teams?: TeamRoster) => {
    const lineup = { players, ...(teams ? { teams } : {}) };
    if (options.mode === 'x01') {
      navigation.push(NORMAL_GAME_SCREEN, { ...lineup, options });
    } else {
      navigation.push(DOUBLES_GAME_SCREEN, { ...lineup, options });
    }
  };
}
