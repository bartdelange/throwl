import { FC, useCallback } from 'react';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameFlowStackNames, StepperParamList } from '../NewGame';
import { useNewGame } from '../../../feature/NewGameContext';
import { DoublesOptionsView } from './components/DoublesOptions/DoublesOptions';
import { X01OptionsView } from './components/X01Options/X01Options';
import { DoublesOptions, X01Options } from '@throwl/shared-domain-models';
import { AppHeader, LogoButton } from '@throwl/shared-ui';
import { NewGameScreenLayout } from '../NewGameScreenLayout';

export const GameOptionsScreen: FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<StepperParamList, GameFlowStackNames.GAME_MODE>
    >();
  const { state, setState } = useNewGame();

  const gameOptions = state.options;

  const saveDoublesOptions = useCallback(
    (opts: DoublesOptions) => {
      setState((state) => ({
        ...state,
        options: {
          ...opts,
          mode: 'doubles',
        },
      }));
    },
    [setState],
  );

  const saveX01Options = useCallback(
    (opts: X01Options) => {
      setState((state) => ({
        ...state,
        options: {
          ...opts,
          mode: 'x01',
        },
      }));
    },
    [setState],
  );

  return (
    <NewGameScreenLayout
      action={
        <LogoButton
          label="Next"
          onPress={() => navigation.push(GameFlowStackNames.PLAYER_SELECT)}
        />
      }
    >
      <AppHeader title={`Game Options`} />
      {gameOptions?.mode === 'doubles' && (
        <DoublesOptionsView
          saveOptions={saveDoublesOptions}
          options={gameOptions}
        />
      )}
      {gameOptions?.mode === 'x01' && (
        <X01OptionsView saveOptions={saveX01Options} options={gameOptions} />
      )}
    </NewGameScreenLayout>
  );
};
