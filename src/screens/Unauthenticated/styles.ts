import { Dimensions, StyleSheet } from 'react-native';

export const makeStyles = () =>
  StyleSheet.create({
    layout: {
      flex: 1,
    },
    tabBar: {
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: '10%',
      marginBottom: '25%',
      width: '100%',
    },
    tabIcon: {
      marginHorizontal: Dimensions.get('window').width * 0.05,
    },
  });
