import { type ComponentProps, FC } from 'react';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameFlowStackNames, StepperParamList } from '../NewGame';
import { getDefaultOptions, useNewGame } from '../../../feature/NewGameContext';
import { LogoButton, AppHeader } from '@throwl/shared-ui';
import { SegmentedButtons, Text } from 'react-native-paper';
import { Platform, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@throwl/shared-theme';
import { NewGameScreenLayout } from '../NewGameScreenLayout';

function GameModePills({
  buttons,
  ...props
}: ComponentProps<typeof SegmentedButtons>) {
  const { colors, roundness } = useAppTheme();
  if (Platform.OS !== 'ios') {
    return <SegmentedButtons {...props} buttons={buttons} />;
  }

  // Draw one rounded outline on iOS so adjacent native borders cannot bleed
  // into the neighboring segment.
  return (
    <SegmentedButtons
      {...props}
      style={[
        styles.pillOutline,
        { borderColor: colors.outline, borderRadius: roundness * 5 },
      ]}
      buttons={buttons.map((button) => ({
        ...button,
        style: styles.pillSegment,
      }))}
    />
  );
}

export const GameModeScreen: FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<StepperParamList, GameFlowStackNames.GAME_MODE>
    >();
  const { state, setState } = useNewGame();
  const { colors } = useAppTheme();
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
      <View style={styles.mode}>
        <GameModePills
          value={state.mode}
          onValueChange={(mode) => {
            if (mode === 'x01' || mode === 'doubles') {
              setState((previous) => ({
                ...previous,
                mode,
                options:
                  previous.options.mode === mode
                    ? previous.options
                    : getDefaultOptions(mode),
              }));
            }
          }}
          buttons={[
            { value: 'x01', label: 'Normal' },
            { value: 'doubles', label: 'Doubles' },
          ]}
        />
        <Text variant="bodyMedium" style={{ color: colors.secondary }}>
          {state.mode === 'x01'
            ? 'You start at 501 points going to 0 while ending with a double.'
            : 'You throw consecutive doubles from highest (D20) to lowest (D1) ending on single Bull and Bull.'}
        </Text>
      </View>
      <View style={styles.format}>
        <GameModePills
          value={state.format}
          onValueChange={(format) => {
            if (format === 'individual' || format === 'teams') {
              setState((previous) => ({
                ...previous,
                format,
                teams: format === 'individual' ? undefined : previous.teams,
              }));
            }
          }}
          buttons={[
            {
              value: 'individual',
              label: 'Individual',
              icon: 'account-outline',
            },
            {
              value: 'teams',
              label: 'Teams',
              icon: 'account-multiple-outline',
            },
          ]}
        />
        <Text variant="bodyMedium" style={{ color: colors.secondary }}>
          {state.format === 'teams'
            ? 'Teammates share a score and take turns throwing.'
            : 'Every player plays for themselves.'}
        </Text>
      </View>
    </NewGameScreenLayout>
  );
};

const styles = StyleSheet.create({
  mode: { gap: 12, marginVertical: 16 },
  format: { gap: 12 },
  pillOutline: { borderWidth: 1, overflow: 'hidden' },
  pillSegment: {
    borderWidth: 0,
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});
