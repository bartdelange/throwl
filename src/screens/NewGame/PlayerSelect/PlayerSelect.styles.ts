import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        layout: {
          flexDirection: 'column',
          alignContent: 'center',
          alignItems: 'center',
        },
        content: {
          width: '80%',
          flexShrink: 1,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: '10%',
        },
        playerList: {
          maxHeight: '80%',
        },
        player: {
          paddingVertical: 5,
          color: colors.onBackground,
          ...Platform.select({
            default: {
              fontWeight: 'bold',
            },
            android: {
              fontFamily: 'Karbon-Bold',
            },
          }),
          fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
        },
        goButton: {
          flex: 1,
          justifyContent: 'space-evenly',
          alignItems: 'center',
          width: '80%',
          minHeight: '20%',
          paddingVertical: Dimensions.get('window').width < 500 ? 0 : '5%',
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
