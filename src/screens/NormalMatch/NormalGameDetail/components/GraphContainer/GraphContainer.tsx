import React, { FC, useEffect, useState } from 'react';
import { Text } from 'react-native-paper';
import { LineChart, lineDataItem } from 'react-native-gifted-charts';
import { GameHelper } from '~/lib/game_helper.ts';
import { Turn } from '~/models/turn.ts';
import { useStyles } from './styles.ts';
import { View } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

interface ScoreContainerProps {
  turns: Turn[];
}

export const GraphContainer: FC<ScoreContainerProps> = ({ turns }) => {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const [maxYValue, setMaxYValue] = useState(0);
  const [averageValues, setAverageValues] = useState<lineDataItem[]>([]);
  const [scoreValues, setScoreValues] = useState<lineDataItem[]>([]);

  useEffect(() => {
    const averageData: lineDataItem[] = [];
    const scoreData: lineDataItem[] = [];
    let walkingAverage = 0;
    let turnCount = 1;

    for (const turn of turns) {
      const turnScore = GameHelper.calculateTurnScore(turn);
      walkingAverage = (walkingAverage * (turnCount - 1) + turnScore) / turnCount;

      averageData.push({ label: `${turnCount}`, value: walkingAverage });
      scoreData.push({ label: `${turnCount}`, value: turnScore });

      turnCount++;
    }

    const maxAverage = averageData.reduce((a, b) => Math.max(a, b.value ?? 0), 0);
    const maxScore = scoreData.reduce((a, b) => Math.max(a, b.value ?? 0), 0);

    setMaxYValue(Math.max(maxAverage, maxScore));
    setAverageValues(averageData);
    setScoreValues(scoreData);
  }, [turns]);

  return (
    <View style={styles.graph}>
      <LineChart
        maxValue={maxYValue + 20}
        data={scoreValues}
        data2={averageValues}
        color1="#03a9f4"
        color2="#8bc34a"
        curved
        dataPointsColor1="#03a9f4"
        dataPointsColor2="#8bc34a"
        hideDataPoints
        spacing={68}
        initialSpacing={0}
        noOfSections={4}
        yAxisColor={colors.primary}
        yAxisThickness={1}
        hideRules
        yAxisTextStyle={{ color: colors.primary }}
        xAxisColor={colors.primary}
        disableScroll={false}
        pointerConfig={{
          pointerStripColor: colors.primary,
          pointerColor: colors.primary,
          radius: 6,
          pointerLabelWidth: 160,
          pointerLabelHeight: 90,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: [lineDataItem, lineDataItem]) => {
            return (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipTextHeader}>Turn {items[0].label}</Text>
                <Text style={styles.tooltipText}>
                  S{items[0].value?.toFixed(2)} - A{items[1].value?.toFixed(2)}
                </Text>
              </View>
            );
          },
        }}
      />
      <View style={styles.legend}>
        <View style={styles.legendEntry}>
          <Text style={styles.legendText}>Points thrown per turn</Text>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendEntry}>
          <View style={[styles.legendBall, { backgroundColor: '#03a9f4' }]} />
          <Text style={styles.legendText}>Score</Text>
        </View>
        <View style={styles.legendEntry}>
          <View style={[styles.legendBall, { backgroundColor: '#8bc34a' }]} />
          <Text style={styles.legendText}>Average</Text>
        </View>
      </View>
    </View>
  );
};
