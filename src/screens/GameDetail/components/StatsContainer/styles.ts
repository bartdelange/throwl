import { Dimensions, StyleSheet } from 'react-native';

export const makeStyles = (textSize: number) => {
  const { height } = Dimensions.get('window');

  return StyleSheet.create({
    scoreStatHeader: {
      fontSize: textSize,
      marginTop: height * 0.0125,
      marginBottom: height * 0.0125,
      fontWeight: '600',
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
