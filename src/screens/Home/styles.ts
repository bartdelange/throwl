import { Dimensions, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const makeStyles = () => {
  const { colors } = useTheme();
  return StyleSheet.create({
    layout: {
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
    },
    logo: {
      paddingTop: '20%',
      paddingBottom: '20%',
      width: Math.max(Dimensions.get('window').width * 0.25, 100),
    },
    userWelcome: {
      paddingHorizontal: '20%',
      fontSize: 72,
      justifyContent: 'center',
      textAlign: 'center',
    },
    homeContent: {
      flex: 1,
      justifyContent: 'center',
    },
    buttons: {
      paddingVertical: 10,
    },
  });
};
