import React, { FC, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';
import { Turn } from '~/models/turn.ts';
import { useStyles } from './styles.ts';
import { View } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';
import { DoublesOptions } from '~/models/game.ts';
import { BarChart, barDataItem } from 'react-native-gifted-charts';
import { GameHelper } from '~/lib/game_helper.ts';
import { DoublesGameHelper } from '~/lib/doubles_game_helper.ts';

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

  useEffect(() => {
    const dartsThrownOnDoubleData: barDataItem[] = [];

    let currentNeededIndex = 0;
    let onTargetCounter = 1;

    let maxOnTargetCounter = 0;
    let highestIndex = 0;

    const allThrows = turns.flatMap(t => t.throws ?? []);

    for (const thrw of allThrows) {
      const needed = targetsInGame[currentNeededIndex];
      if (!needed) break; // finished

      const isValid = thrw?.isValid !== false;
      const isHit = isValid && DoublesGameHelper.sameTarget(thrw, needed);

      if (isHit) {
        dartsThrownOnDoubleData.push({
          label: GameHelper.createScoreString(needed),
          value: onTargetCounter,
          labelTextStyle: styles.labelText,
        });

        if (onTargetCounter > (dartsThrownOnDoubleData[highestIndex]?.value ?? 0)) {
          highestIndex = dartsThrownOnDoubleData.length - 1; // NOTE: index in data array, not target index
        }

        maxOnTargetCounter = Math.max(maxOnTargetCounter, onTargetCounter);

        currentNeededIndex++;
        onTargetCounter = 1;
      } else {
        onTargetCounter++;
      }
    }

    setMaxYValue(maxOnTargetCounter);

    if (dartsThrownOnDoubleData.length > 0) {
      dartsThrownOnDoubleData[highestIndex] = {
        ...dartsThrownOnDoubleData[highestIndex],
        frontColor: colors.primary,
      };
    }

    setScoreValues(dartsThrownOnDoubleData);
  }, [colors.primary, styles.labelText, targetsInGame, turns]);

  return (
    <View style={styles.graph}>
      <BarChart
        maxValue={maxYValue + maxYValue / 3}
        data={scoreValues}
        barWidth={16}
        barBorderTopLeftRadius={4}
        barBorderTopRightRadius={4}
        frontColor="#03a9f4"
        yAxisThickness={0}
        initialSpacing={30}
        xAxisColor={colors.primary}
        color={colors.primary}
        hideYAxisText
        hideRules
        renderTooltip={(item: barDataItem) => {
          return (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipTextHeader}>{item.label}</Text>
              <Text style={styles.tooltipText}>{item.value} Darts</Text>
            </View>
          );
        }}
      />
      <View style={styles.legend}>
        <View style={styles.legendEntry}>
          <Text style={styles.legendText}>Darts used per double</Text>
        </View>
      </View>
    </View>
  );
};
