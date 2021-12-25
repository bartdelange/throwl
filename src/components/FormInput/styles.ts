import { StyleSheet } from 'react-native';

export const makeStyles = () =>
  StyleSheet.create({
    wrapper: {
      position: 'relative',
      alignItems: 'center',
      alignContent: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    input: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginTop: 5,
      marginBottom: 10,
      fontSize: 16,
      borderRadius: 100,
      minWidth: '100%',
      backgroundColor: '#FFF',
    },
  });
