import React from 'react';
import { View } from 'react-native';
import { Text, ThemeProvider } from 'react-native-paper';
import { theme } from '~/App/App';
import { ThrowCount, ThrowStats, TurnStats } from '~/lib/score_helper';
import { Throw } from '~/models/throw';
import { makeStyles } from './styles';

interface ScoreContainerProps {
  textSize: number;
  turnStats: TurnStats;
  throwStats: ThrowStats;
  mostThrown: ThrowCount;
  lastThrown: Throw;
  userScore: number;
}

export const StatsContainer: React.FC<ScoreContainerProps> = ({
  textSize,
  turnStats,
  throwStats,
  mostThrown,
  lastThrown,
  userScore,
}) => {
  const styles = makeStyles(textSize);
  return (
    <ThemeProvider
      theme={{
        ...theme,
        colors: { ...theme.colors, text: theme.colors.primary },
      }}>
      <View>
        <Text style={styles.scoreStatHeader}>Turn stats</Text>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Total turns taken
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.total}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Turns spend between 170 and 100
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.under170}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Turns spend under 100
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.under100}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Invalid turns thrown
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.invalid}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Turns thrown between 30 and 50
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.between30and50}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Turns thrown between 50 and 100
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.between50and100}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Turns thrown higher than 100
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {turnStats.moreThan100}
          </Text>
        </View>
        <Text style={styles.scoreStatHeader}>Throw stats</Text>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Triples thrown
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {throwStats.triples}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Doubles thrown
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {throwStats.doubles}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Thrown out
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {throwStats.out}
          </Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            Most thrown
          </Text>
          <Text style={styles.scoreItemText} numberOfLines={1}>
            {mostThrown.throw.type[0].toUpperCase()}
            {mostThrown.throw.score} ({mostThrown.count}x)
          </Text>
        </View>
        {userScore === 0 && (
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemText} numberOfLines={1}>
              Winning throw
            </Text>
            <Text style={styles.scoreItemText} numberOfLines={1}>
              {lastThrown.type[0].toUpperCase()}
              {lastThrown.score}
            </Text>
          </View>
        )}
      </View>
    </ThemeProvider>
  );
};
