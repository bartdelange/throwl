import { Dimensions, StyleSheet } from 'react-native';

export const useStyles = () =>
  StyleSheet.create({
    tabBar: {
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: '10%',
      width: '100%',
    },
    tabIcon: {
      marginHorizontal: Dimensions.get('window').width * 0.05,
    },
  });
