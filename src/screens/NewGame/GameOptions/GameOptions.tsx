import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameFlowStackNames, StepperParamList } from '~/screens/NewGame/NewGame.tsx';
import { useNewGame } from '~/context/NewGameContext';
import { DoublesOptionsView } from './components/DoublesOptions/DoublesOptions.tsx';
import { X01OptionsView } from './components/X01Options/X01Options.tsx';
import { DoublesOptions, X01Options } from '~/models/game.ts';
import { AppHeader } from '~/components/AppHeader/AppHeader.tsx';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen.tsx';
import { View } from 'react-native';
import { LogoButton } from '~/components/LogoButton/LogoButton.tsx';
import { useStyles } from '~/screens/NewGame/GameOptions/GameOptions.styles.ts';

export const GameOptionsScreen: FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<StepperParamList, GameFlowStackNames.GAME_MODE>>();
  const { state, setState } = useNewGame();
  const styles = useStyles();

  const gameMode = useMemo(() => state.mode, [state]);
  const gameOptions = useMemo(() => state.options, [state]);

  useEffect(() => {
    if (gameOptions?.mode !== gameMode)
      setState(s => {
        switch (gameMode) {
          case 'doubles':
            return {
              ...s,
              options: {
                mode: 'doubles',
                quickMatch: false,
                endOnInvalid: false,
                skipBull: false,
              },
            };
          case 'x01':
          default:
            return {
              ...s,
              options: {
                mode: 'x01',
                startingScore: 501,
              },
            };
        }
      });
  }, [gameOptions, gameMode, setState]);

  const saveDoublesOptions = useCallback(
    (opts: DoublesOptions) => {
      setState(state => ({
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
      setState(state => ({
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
    <FullScreenLayout size="fullscreen" style={styles.layout}>
      <View style={styles.content}>
        <AppHeader title={`Game Options`} />
        {gameOptions?.mode === 'doubles' && (
          <DoublesOptionsView saveOptions={saveDoublesOptions} options={gameOptions} />
        )}
        {gameOptions?.mode === 'x01' && (
          <X01OptionsView saveOptions={saveX01Options} options={gameOptions} />
        )}
      </View>
      <View style={styles.button}>
        <LogoButton
          label={`Next`}
          onPress={() => navigation.push(GameFlowStackNames.PLAYER_SELECT)}
        />
      </View>
    </FullScreenLayout>
  );
};
