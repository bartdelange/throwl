import { Dimensions, Platform, StyleSheet } from 'react-native';

export const makeStyles = () =>
  StyleSheet.create({
    player: {
      paddingVertical: 5,
      color: 'white',
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
      fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
    },
    iconStyle: {
      borderColor: 'white',
      borderRadius: Dimensions.get('window').width * 0.01,
    },
    positionStyle: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    positionTextStyle: {
      textAlign: 'center',
      includeFontPadding: false,
      paddingTop: Dimensions.get('window').width * 0.005,
      height: Math.max(Dimensions.get('window').width * 0.03, 18),
      fontSize: Math.max(Dimensions.get('window').width * 0.03, 18),
      color: 'white',
    },
  });
