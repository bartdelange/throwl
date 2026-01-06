import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import React, { FC } from 'react';
import { useStyles } from './TurnIndicatorBar.styles.tsx';
import { Turn } from '~/models/turn.ts';
import { GameHelper } from '~/lib/game_helper.ts';
import { Throw } from '~/models/throw.ts';
import { useAppTheme } from '~/App/theming.tsx';

interface TurnIndicatorBarProps {
  currentTurn: Turn;
  turnNeeded: [Throw | undefined, Throw | undefined, Throw | undefined];
  iconSize: number;
  undoThrow: () => void;
}
export const TurnIndicatorBar: FC<TurnIndicatorBarProps> = ({
  currentTurn,
  turnNeeded,
  iconSize,
  undoThrow,
}) => {
  const styles = useStyles();
  const { colors } = useAppTheme();

  return (
    <View style={styles.currentTurnScoreContainer}>
      {([0, 1, 2] as const).map(thrw => (
        <View style={styles.currentThrowContainer} key={thrw}>
          <Text style={styles.currentThrowNumberText}>{thrw + 1}</Text>
          <Text style={styles.currentThrowNumberTextSuperScript}>st</Text>
          <Text style={styles.currentThrowScoreText}>
            {GameHelper.createScoreString(currentTurn.throws[thrw])}
          </Text>

          {turnNeeded[thrw] && (
            <Text style={styles.neededScoreText}>
              [{GameHelper.createScoreString(turnNeeded[thrw])}]
            </Text>
          )}
        </View>
      ))}
      <IconButton
        icon="restore"
        size={iconSize}
        iconColor={colors.primary}
        onPress={undoThrow}
        rippleColor="rgba(255, 255, 255, .95)"
        style={[
          styles.undoButton,
          {
            paddingRight: iconSize * 0.067,
          },
        ]}
      />
    </View>
  );
};
