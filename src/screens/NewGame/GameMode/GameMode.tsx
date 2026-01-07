import React, { FC, useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameFlowStackNames, StepperParamList } from '~/screens/NewGame/NewGame.tsx';
import { useNewGame } from '~/context/NewGameContext.tsx';
import { GameMode } from '~/models/game.ts';
import { ModeAccordion } from '~/screens/NewGame/GameMode/components/ModeAccordion.tsx';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import { AppHeader } from '~/components/AppHeader/AppHeader.tsx';
import { View } from 'react-native';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen.tsx';
import { useStyles } from '~/screens/NewGame/GameMode/GameMode.styles.ts';

export const GameModeScreen: FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<StepperParamList, GameFlowStackNames.GAME_MODE>>();
  const { state, setState } = useNewGame();
  const [openIndex, setOpenIndex] = useState(state.options?.mode === 'doubles' ? 1 : 0);
  const styles = useStyles();

  const onPickMode = useCallback(
    (mode: GameMode) => () => {
      if (mode === 'doubles') {
        setOpenIndex(1);
      } else {
        setOpenIndex(0);
      }

      setState(s => ({
        ...s,
        mode,
      }));
    },
    [setState],
  );

  return (
    <FullScreenLayout size="fullscreen" style={styles.layout}>
      <View style={styles.content}>
        <AppHeader title="Game Mode" />
        <ModeAccordion
          title={'Normal'}
          description={'Standard darts game.'}
          descriptionSubtext={'You start at 501 points going to 0 while ending with a double.'}
          open={openIndex === 0}
          setOpen={onPickMode('x01')}
        />
        <ModeAccordion
          title={'Doubles'}
          description={'Doubles darts game.'}
          descriptionSubtext={
            'You throw consecutive doubles from highest (D20) to lowest (D1) ending on single Bull and Bull.'
          }
          open={openIndex === 1}
          setOpen={onPickMode('doubles')}
        />
      </View>
      <View style={styles.button}>
        <LogoButton
          label={`Next`}
          onPress={() => navigation.push(GameFlowStackNames.GAME_OPTIONS)}
        />
      </View>
    </FullScreenLayout>
  );
};
