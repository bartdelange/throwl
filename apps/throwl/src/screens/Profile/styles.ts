import { StyleSheet } from 'react-native';
import { useMemo } from 'react';

export const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        layout: {
          // flexDirection: 'column',
          // alignContent: 'center',
          // alignItems: 'center',
          // paddingBottom: '15%',
          margin: 0,
          padding: 0,
        },
        content: {
          margin: 0,
          padding: 0,
          paddingHorizontal: '10%',
          paddingBottom: '5%',
        },
        section: {
          flexGrow: 1,
          marginBottom: '15%',
        },
        input: {
          alignItems: 'flex-start',
          marginBottom: '2.5%',
        },
      }),
    [],
  );
};
