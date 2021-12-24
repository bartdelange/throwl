import { Dimensions, StyleSheet } from 'react-native';

export const makeStyles = () => {
  const { height } = Dimensions.get('window');

  return StyleSheet.create({
    graph: {
      aspectRatio: 1,
      backgroundColor: 'red',
    },
    legend: {
      flexDirection: 'row',
      padding: 15,
    },
    legendEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    legendBall: {
      height: 10,
      aspectRatio: 1,
      borderRadius: 10,
      marginRight: 10,
    },
  });
};
