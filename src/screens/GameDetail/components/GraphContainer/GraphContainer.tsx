import React from 'react';
import { ThemeProvider, useTheme } from 'react-native-paper';
import {
  Chart,
  HorizontalAxis,
  Line,
  Tooltip,
  VerticalAxis,
} from 'react-native-responsive-linechart';
import { theme } from '~/App/App';
import { ScoreHelper } from '~/lib/score_helper';
import { Turn } from '~/models/turn';
import { makeStyles } from './styles';

interface ScoreContainerProps {
  turns: Turn[];
}

type graphPoint = { x: number; y: number };

export const GraphContainer: React.FC<ScoreContainerProps> = ({ turns }) => {
  const { colors } = useTheme();
  const styles = makeStyles();
  const [minYValue, setMinYValue] = React.useState(0);
  const [maxYValue, setMaxYValue] = React.useState(0);
  const [averageValues, setAverageValues] = React.useState<graphPoint[]>([]);
  const [scoreValues, setScoreValues] = React.useState<graphPoint[]>([]);

  React.useEffect(() => {
    const averageData: graphPoint[] = [];
    const scoreData: graphPoint[] = [];
    let walkingAverage = 0;
    let turnCount = 1;

    for (const turn of turns) {
      const turnScore = ScoreHelper.calculateTurnScore(turn);
      walkingAverage =
        (walkingAverage * (turnCount - 1) + turnScore) / turnCount;

      averageData.push({ x: turnCount, y: walkingAverage });
      scoreData.push({ x: turnCount, y: turnScore });

      turnCount++;
    }

    const minAverage = averageData.reduce((a, b) => Math.min(a, b.y), Infinity);
    const minScore = scoreData.reduce((a, b) => Math.min(a, b.y), Infinity);
    const maxAverage = averageData.reduce((a, b) => Math.max(a, b.y), 0);
    const maxScore = scoreData.reduce((a, b) => Math.max(a, b.y), 0);

    setMinYValue(Math.min(minAverage, minScore));
    setMaxYValue(Math.max(maxAverage, maxScore));
    setAverageValues(averageData);
    setScoreValues(scoreData);
  }, [turns]);

  return (
    <ThemeProvider
      theme={{
        ...theme,
        colors: { ...theme.colors, text: theme.colors.primary },
      }}>
      <Chart
        data={scoreValues}
        style={{ height: '100%', width: '100%', marginBottom: 40 }}
        padding={{ left: 40, bottom: 20, right: 40, top: 40 }}
        yDomain={{ min: 0, max: maxYValue }}>
        <VerticalAxis
          tickCount={3}
          theme={{
            axis: { stroke: { color: colors.primary, width: 2 } },
            ticks: { stroke: { color: colors.primary, width: 2 } },
            grid: { stroke: { color: 'rgba(0, 0, 0, .05)', width: 2 } },
            labels: { formatter: (v: number) => v.toFixed(2) },
          }}
        />
        <HorizontalAxis
          tickCount={Math.min(scoreValues.length, 15)}
          theme={{
            axis: { stroke: { color: colors.primary, width: 2 } },
            ticks: { stroke: { color: colors.primary, width: 2 } },
            grid: { visible: false },
            labels: { label: { rotation: 50 }, formatter: v => v.toFixed(0) },
          }}
        />
        <Line
          smoothing="bezier"
          tension={0.3}
          tooltipComponent={
            <Tooltip
              theme={{
                shape: {
                  height: 30,
                  width: 50,
                  // opacity: 0.5,
                },
                formatter: v => v.y.toFixed(2),
              }}
            />
          }
          theme={{
            scatter: {
              default: { width: 10, height: 10, rx: 4, color: 'transparent' },
              selected: { color: '#03a9f4' },
            },
            stroke: { color: '#03a9f4', width: 2 },
          }}
        />
        <Line
          data={averageValues}
          smoothing="bezier"
          tension={0.3}
          tooltipComponent={
            <Tooltip
              theme={{
                shape: {
                  height: 30,
                  width: 50,
                  // opacity: 0.5,
                },
                formatter: v => v.y.toFixed(2),
              }}
            />
          }
          theme={{
            scatter: {
              default: { width: 10, height: 10, rx: 4, color: 'transparent' },
              selected: { color: '#8bc34a' },
            },
            stroke: { color: '#8bc34a', width: 2 },
          }}
        />
      </Chart>
    </ThemeProvider>
  );
};
