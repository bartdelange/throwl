import { StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';
import { useMemo } from 'react';

export const useStyles = () => {
  const { colors } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        graph: {
          aspectRatio: 1,
          overflow: 'hidden',
          marginTop: 32,
          marginLeft: -8,
          padding: 0,
        },
        legend: {
          flexDirection: 'row',
          padding: 15,
        },
        legendEntry: {
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: 20,
        },
        legendText: {
          color: colors.primary,
        },
        labelText: {
          color: colors.primary,
        },
        tooltip: {
          marginBottom: 10,
          backgroundColor: colors.background,
          paddingHorizontal: 6,
          paddingVertical: 4,
          borderRadius: 4,
          marginLeft: -30 + 8,
          width: 60,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tooltipTextHeader: {
          fontSize: 18,
          color: colors.onBackground,
        },
        tooltipText: {
          fontSize: 12,
          color: colors.onBackground,
        },
      }),
    [colors.background, colors.onBackground, colors.primary],
  );
};
