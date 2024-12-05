import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const makeStyles = () => {
  const { colors } = useAppTheme();
  return StyleSheet.create({
    layout: {
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '80%',
      height: '100%',
      flexShrink: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '5%',
      marginTop: '10%',
    },
    heading: {
      fontSize: 48,
      flex: 1,
      marginRight: '25%',
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
    divider: {
      height: 3,
      backgroundColor: 'white',
      marginBottom: '2.5%',
    },
    section: {
      flexGrow: 0,
    },
    input: {
      marginVertical: '5%',
    },
    button: {
      marginBottom: '10%',
      alignSelf: 'center',
    },
    friendContainer: {
      paddingVertical: Math.min(25, Dimensions.get('window').height * 0.09),
      height:
        Math.min(48, Dimensions.get('window').width * 0.09) +
        Math.min(25, Dimensions.get('window').height * 0.09) * 2,
      backgroundColor: colors.primary,
    },
    friendName: {
      color: 'white',
      fontSize: Math.min(48, Dimensions.get('window').width * 0.09),
    },
  });
};
