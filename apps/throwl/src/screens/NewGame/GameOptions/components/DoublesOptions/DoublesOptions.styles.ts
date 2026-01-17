import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useAppTheme } from '../../../../../App/theming';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  return useMemo(
    () =>
      StyleSheet.create({
        section: { marginLeft: -16, marginRight: -16 },
        listItem: {
          paddingRight: 8,
        },
        listItemContainer: {
          justifyContent: 'center',
          alignSelf: 'center',
          alignItems: 'center',
        },
        listItemContent: {
          paddingRight: 8,
        },
        itemTitle: {
          fontSize: Math.max(width * 0.035, 18),
          color: colors.onBackground,
          paddingBottom: 10,
        },
        itemDescription: {
          fontSize: Math.max(width * 0.02, 12),
          color: colors.onBackground,
        },
      }),
    [colors.onBackground, width],
  );
};
