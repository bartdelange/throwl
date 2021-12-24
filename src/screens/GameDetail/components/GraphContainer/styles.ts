import { Dimensions, StyleSheet } from 'react-native';

export const makeStyles = () => {
  const { height } = Dimensions.get('window');

  return StyleSheet.create({
    graph: {
      aspectRatio: 1,
      backgroundColor: 'red',
    },
  });
};
