import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useAppTheme } from '../../../../../App/theming';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();

  return useMemo(
    () =>
      StyleSheet.create({
        startingScoreTitle: {
          paddingVertical: 16,
          fontSize: Math.max(width * 0.05, 24),
        },
        scoreInput: {
          marginRight: -10,
          marginLeft: -10,
          height: (Math.max(height * 0.06, 55) + 15) * 5,
        },
        scoreButton: {
          margin: 5,
          borderWidth: 2,
          borderRadius: 10,
          alignItems: 'center',
          alignContent: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: Math.max(height * 0.06, 50),
          borderColor: colors.onBackground,
        },
        scorePreviewWrapper: {
          flex: 2.4,
        },
        scoreRemoveButton: {
          textAlign: 'center',
          color: colors.onBackground,
          fontSize: Math.max(width * 0.05, 24),
        },
        scoreButtonText: {
          textAlign: 'center',
          includeFontPadding: false,
          color: colors.onBackground,
          fontSize: Math.max(width * 0.05, 24),
        },
      }),
    [height, colors.onBackground, width],
  );
};
