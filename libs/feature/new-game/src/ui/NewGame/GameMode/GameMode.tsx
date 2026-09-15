import { FC, useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameFlowStackNames, StepperParamList } from '../NewGame';
import { getDefaultOptions, useNewGame } from '../../../feature/NewGameContext';
import { GameMode } from '@throwl/shared-domain-models';
import { ModeAccordion } from './components/ModeAccordion';
import { LogoButton, AppHeader } from '@throwl/shared-ui';
import { NewGameScreenLayout } from '../NewGameScreenLayout';

export const GameModeScreen: FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<StepperParamList, GameFlowStackNames.GAME_MODE>
    >();
  const { state, setState } = useNewGame();
  const [openIndex, setOpenIndex] = useState(
    state.options?.mode === 'doubles' ? 1 : 0,
  );

  const onPickMode = useCallback(
    (mode: GameMode) => () => {
      if (mode === 'doubles') {
        setOpenIndex(1);
      } else {
        setOpenIndex(0);
      }

      setState((s) => ({
        ...s,
        mode,
        options: s.options.mode === mode ? s.options : getDefaultOptions(mode),
      }));
    },
    [setState],
  );

  return (
    <NewGameScreenLayout
      action={
        <LogoButton
          label="Next"
          onPress={() => navigation.push(GameFlowStackNames.GAME_OPTIONS)}
        />
      }
    >
      <AppHeader title="Game Mode" />
      <ModeAccordion
        title={'Normal'}
        description={'Standard darts game.'}
        descriptionSubtext={
          'You start at 501 points going to 0 while ending with a double.'
        }
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
    </NewGameScreenLayout>
  );
};
