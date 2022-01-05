import { Dimensions, Platform, StyleSheet } from 'react-native';

export const makeStyles = (textSize: number) => {
  const { height } = Dimensions.get('window');

  return StyleSheet.create({
    scoreStatHeader: {
      fontSize: textSize,
      marginTop: height * 0.0125,
      marginBottom: height * 0.0125,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
    },
    scoreItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    scoreItemText: {
      fontSize: Math.max(textSize * 0.5, 18),
    },
  });
};
