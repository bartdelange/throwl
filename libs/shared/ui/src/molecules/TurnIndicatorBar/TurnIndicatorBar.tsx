import { FC } from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useStyles } from './TurnIndicatorBar.styles';
import { Throw, Turn } from '@throwl/shared-domain-models';
import { useAppTheme } from '@throwl/shared-theme';

interface TurnIndicatorBarProps {
  currentTurn: Turn;
  turnNeeded: [Throw | undefined, Throw | undefined, Throw | undefined];
  iconSize: number;
  undoThrow: () => void;
  createScoreString: (value: Throw) => string;
}
export const TurnIndicatorBar: FC<TurnIndicatorBarProps> = ({
  currentTurn,
  turnNeeded,
  iconSize,
  undoThrow,
  createScoreString,
}) => {
  const styles = useStyles();
  const { colors } = useAppTheme();

  return (
    <View style={styles.currentTurnScoreContainer}>
      {([0, 1, 2] as const).map((thrw) => (
        <View style={styles.currentThrowContainer} key={thrw}>
          <Text style={styles.currentThrowNumberText}>{thrw + 1}</Text>
          <Text style={styles.currentThrowNumberTextSuperScript}>st</Text>
          <Text style={styles.currentThrowScoreText}>
            {createScoreString(currentTurn.throws[thrw])}
          </Text>

          {turnNeeded[thrw] && (
            <Text style={styles.neededScoreText}>
              [{createScoreString(turnNeeded[thrw])}]
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
