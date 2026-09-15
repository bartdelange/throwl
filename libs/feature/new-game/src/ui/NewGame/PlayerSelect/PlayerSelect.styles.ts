import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useAppTheme } from '@throwl/shared-theme';

export const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: '10%',
        },
        playerList: {
          flex: 1,
          minHeight: 0,
        },
        player: {
          paddingVertical: 5,
          color: colors.onBackground,
          ...Platform.select({
            default: {
              fontWeight: 'bold',
            },
            android: {
              fontFamily: 'Jost',
            },
          }),
          fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
        },
        input: {
          marginVertical: '5%',
          width: '75%',
          alignSelf: 'center',
        },
        button: {
          marginBottom: '10%',
          alignSelf: 'center',
        },
      }),
    [colors.onBackground],
  );
};
