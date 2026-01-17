import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

export const useStyles = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () =>
      StyleSheet.create({
        // eslint-disable-next-line react-native/no-color-literals
        loader: {
          position: 'absolute',
          left: width / 2 - width * 0.1,
          top: height / 2 - width * 0.1,
          width: width * 0.2,
          aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          borderRadius: width * 0.05,
          backgroundColor: 'rgba(0,0,0,.25)',
        },
      }),
    [height, width],
  );
};
