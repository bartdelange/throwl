import React, { FC } from 'react';
import { View } from 'react-native';
import { Text, ThemeProvider } from 'react-native-paper';
import { paperTheme, useAppTheme } from '~/App/theming.tsx';
import { useStyles } from './styles.ts';
import { DoublesGameTurnStats } from '~/lib/game_stats_helper.ts';

interface ScoreContainerProps {
  textSize: number;
  turnStats: DoublesGameTurnStats;
}

export const StatsContainer: FC<ScoreContainerProps> = ({ textSize, turnStats }) => {
  const styles = useStyles(textSize);
  const { colors } = useAppTheme();

  return (
    <ThemeProvider
      theme={{
        ...paperTheme,
        colors: {
          ...colors,
          text: paperTheme.colors.primary,
        },
      }}
    >
      <View>
        <Text style={styles.scoreStatHeader}>Turn stats</Text>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Total turns taken
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.totalTurns}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Total darts thrown
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.totalDarts}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Darts thrown not on target
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.notOnTarget}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Average darts per double thrown
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.avgDartsPerDouble}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Invalid turns thrown
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.invalidTrows}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Times you threw a streak
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.consecutiveDoublesAmount}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Highest double streak
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.consecutiveDoublesStreak}
          </Text>
        </View>
      </View>
    </ThemeProvider>
  );
};
