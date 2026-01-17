import { useMemo } from 'react';
import { useAppTheme } from '../../App/theming';
import { StyleSheet } from 'react-native';

export const useStyles = () => {
  const { colors } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        header: { backgroundColor: colors.background, elevation: 0 },
      }),
    [colors.background],
  );
};
