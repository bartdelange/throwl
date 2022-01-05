import { Platform, StyleSheet } from 'react-native';

export const makeStyles = () =>
  StyleSheet.create({
    button: {
      width: 'auto',
      alignContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    logo: {
      marginRight: 20,
    },
    text: {
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
      marginTop: 5,
    },
  });
