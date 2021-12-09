import React from 'react';
import { View } from 'react-native';
import { ThemeProvider } from 'react-native-paper';
import { theme } from '~/App/App';
import { Turn } from '~/models/turn';
import { makeStyles } from './styles';

interface ScoreContainerProps {
  turns: Turn[];
}

export const GraphContainer: React.FC<ScoreContainerProps> = ({ turns }) => {
  const styles = makeStyles();

  return (
    <ThemeProvider
      theme={{
        ...theme,
        colors: { ...theme.colors, text: theme.colors.primary },
      }}>
      <View style={styles.graph} />
    </ThemeProvider>
  );
};
