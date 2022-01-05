import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const makeStyles = () => {
  const { colors } = useTheme();
  return StyleSheet.create({
    layout: {
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '80%',
      paddingTop: '10%',
      flexShrink: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: '10%',
    },
    heading: {
      fontSize: 72,
      flex: 1,
      paddingRight: '25%',
      includeFontPadding: false,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
    },
    menuButton: {
      alignSelf: 'flex-end',
      backgroundColor: 'transparent',
      borderRadius: 10000,
      paddingBottom: 5,
    },
    divider: {
      height: 3,
      backgroundColor: 'white',
    },
    playerList: {
      paddingTop: '10%',
      paddingBottom: Dimensions.get('window').width < 500 ? 0 : '5%',
      maxHeight: '80%',
    },
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
    scoreInput: {
      height: (Math.max(Dimensions.get('window').height * 0.06, 55) + 15) * 6,
    },
    scoreButton: {
      padding: 10,
      margin: 10,
      borderWidth: 2,
      borderRadius: 10,
      alignItems: 'center',
      alignContent: 'center',
      height: Math.max(Dimensions.get('window').height * 0.06, 55),
      borderColor: colors.primary,
    },
    scorePreviewWrapper: {
      flex: 2.4,
    },
    scoreRemoveButton: {
      textAlign: 'center',
      paddingTop: 5,
      color: colors.primary,
      fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
    },
    scoreButtonText: {
      textAlign: 'center',
      paddingTop: 5,
      includeFontPadding: false,
      color: colors.primary,
      fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
    },
    goButton: {
      flex: 1,
      justifyContent: 'space-evenly',
      alignItems: 'center',
      width: '80%',
      minHeight: '20%',
      paddingVertical: Dimensions.get('window').width < 500 ? 0 : '5%',
    },
  });
};
