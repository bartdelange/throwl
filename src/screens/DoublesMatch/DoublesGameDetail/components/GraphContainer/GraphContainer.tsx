import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';
import { Turn } from '~/models/turn.ts';
import { useStyles } from './styles.ts';
import { View } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';
import { DoublesOptions } from '~/models/game.ts';
import { BarChart, barDataItem } from 'react-native-gifted-charts';
import { GameHelper } from '~/lib/game_helper.ts';
import { DoublesGameHelper } from '~/lib/doubles_game_helper.ts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ScoreContainerProps {
  turns: Turn[];
  gameOptions: DoublesOptions;
}

export const GraphContainer: FC<ScoreContainerProps> = ({ turns, gameOptions }) => {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const [maxYValue, setMaxYValue] = useState<number>(0);
  const [scoreValues, setScoreValues] = useState<barDataItem[]>([]);
  const targetsInGame = useMemo(() => DoublesGameHelper.buildTargets(gameOptions), [gameOptions]);

  const makeIconLabel = useCallback(
    (name: string, color: string) => () => (
      <MaterialCommunityIcons name={name} size={14} color={color} style={styles.topLabelIcon} />
    ),
    [styles.topLabelIcon],
  );

  useEffect(() => {
    const data: barDataItem[] = targetsInGame.map(t => ({
      label: GameHelper.createScoreString(t),
      value: 0,
      labelTextStyle: styles.labelText,
    }));

    let currentNeededIndex = 0;
    let onTargetCounter = 0;

    const allThrows = turns.flatMap(t => t.throws ?? []);

    let streak = 0;
    let bestStreakLen = 0;
    let bestStreakEndIndex = -1;

    for (const thrw of allThrows) {
      const expected = targetsInGame[currentNeededIndex];
      if (!expected) break;

      const isValid = thrw?.isValid !== false;
      const isHit = isValid && DoublesGameHelper.sameTarget(thrw, expected);

      if (isHit) {
        const dartsUsed = onTargetCounter + 1;
        data[currentNeededIndex] = {
          ...data[currentNeededIndex],
          value: dartsUsed,
        };

        streak += 1;
        if (streak >= bestStreakLen) {
          bestStreakLen = streak;
          bestStreakEndIndex = currentNeededIndex;
        }

        currentNeededIndex++;
        onTargetCounter = 0;
      } else {
        onTargetCounter++;
        streak = 0;
      }
    }

    if (currentNeededIndex < data.length && onTargetCounter > 0) {
      data[currentNeededIndex] = {
        ...data[currentNeededIndex],
        value: onTargetCounter,
        frontColor: colors.error,
      };
    }

    const completedCount = currentNeededIndex;

    let crownIndex = -1;
    if (completedCount >= 3) {
      let min = Number.POSITIVE_INFINITY;
      for (let i = 0; i < completedCount; i++) {
        const v = data[i]?.value ?? 0;
        if (v > 0 && v < min) {
          min = v;
          crownIndex = i;
        }
      }
    }

    const fireIndices = new Set<number>();
    if (bestStreakLen >= 2 && bestStreakEndIndex >= 0) {
      const start = bestStreakEndIndex - bestStreakLen + 1;
      for (let i = start; i <= bestStreakEndIndex; i++) {
        if (i >= 0 && i < completedCount) fireIndices.add(i);
      }
    }

    for (let i = 0; i < data.length; i++) {
      const hasFire = fireIndices.has(i);
      const hasCrown = i === crownIndex;

      if (hasFire) {
        data[i] = {
          ...data[i],
          topLabelComponent: makeIconLabel('fire', colors.error),
        };
      } else if (hasCrown) {
        data[i] = {
          ...data[i],
          topLabelComponent: makeIconLabel('crown', colors.primary),
        };
      }
    }

    // max y
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i]?.value ?? 0;
      if (v > max) max = v;
    }

    setMaxYValue(max);
    setScoreValues(data);
  }, [colors.error, colors.primary, makeIconLabel, styles.labelText, targetsInGame, turns]);

  return (
    <View style={styles.graph}>
      <BarChart
        maxValue={maxYValue + maxYValue / 3}
        data={scoreValues}
        barWidth={16}
        barBorderTopLeftRadius={4}
        barBorderTopRightRadius={4}
        frontColor="#03a9f4"
        noOfSections={4}
        initialSpacing={30}
        xAxisColor={colors.primary}
        color={colors.primary}
        hideRules
        isAnimated
        renderTooltip={(item: barDataItem) => {
          return (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipTextHeader}>{item.label}</Text>
              <Text style={styles.tooltipText}>{item.value} Dart(s)</Text>
            </View>
          );
        }}
      />
      <View style={styles.legend}>
        <View style={styles.legendEntry}>
          <MaterialCommunityIcons
            name="fire"
            size={14}
            color={colors.error}
            style={styles.legendIcon}
          />
          <Text style={styles.legendText}>Your best streak</Text>
        </View>
        <View style={styles.legendEntry}>
          <MaterialCommunityIcons
            name="crown"
            size={14}
            color={colors.primary}
            style={styles.legendIcon}
          />
          <Text style={styles.legendText}>Your quickest double</Text>
        </View>
      </View>
    </View>
  );
};
