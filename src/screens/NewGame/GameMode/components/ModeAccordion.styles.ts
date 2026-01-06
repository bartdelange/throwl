import { Dimensions, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';
import { useMemo } from 'react';

export const useStyles = () => {
  const { colors } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        listItem: {
          paddingLeft: 8,
          paddingRight: 0,
        },
        listItemContainer: {
          justifyContent: 'center',
          alignSelf: 'center',
          alignItems: 'center',
          paddingLeft: -8,
          paddingRight: -8,
        },
        listItemContent: {
          marginVertical: '2.5%',
          paddingLeft: 16,
          paddingRight: 16,
        },
        title: {
          fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
          color: colors.onBackground,
        },
        itemTitle: {
          fontSize: Math.max(Dimensions.get('window').width * 0.035, 18),
          color: colors.onBackground,
          paddingBottom: 10,
        },
        itemDescription: {
          fontSize: Math.max(Dimensions.get('window').width * 0.02, 12),
          color: colors.onBackground,
        },
        accordionContainer: { marginLeft: -32 },
      }),
    [colors.onBackground],
  );
};
