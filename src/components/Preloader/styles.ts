import { Dimensions, StyleSheet } from 'react-native';

export const useStyles = () =>
  StyleSheet.create({
    layout: {
      alignContent: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressScaler: {
      transform: [{ scale: Dimensions.get('window').width / 2 / 500 }],
    },
    progressWrapper: {
      width: 500,
      height: 500,
      position: 'relative',
    },
    progressCircle: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    progressLogo: { position: 'absolute', top: 25, left: 25 },
    loadedWrapper: { width: '100%', height: '100%' },
  });
