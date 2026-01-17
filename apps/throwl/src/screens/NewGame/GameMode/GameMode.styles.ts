import { Dimensions, StyleSheet } from 'react-native';
import { useMemo } from 'react';

export const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        layout: {
          flexDirection: 'column',
          alignContent: 'center',
          alignItems: 'center',
        },
        content: {
          flex: 1,
          width: '80%',
        },
        button: {
          flex: 1,
          justifyContent: 'space-evenly',
          alignItems: 'center',
          width: '80%',
          minHeight: '20%',
          paddingVertical: Dimensions.get('window').width < 500 ? 0 : '5%',
        },
      }),
    [],
  );
};
