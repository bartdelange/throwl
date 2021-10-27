import { StyleSheet } from 'react-native';

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
      fontWeight: '700',
      marginTop: 5,
    },
  });
