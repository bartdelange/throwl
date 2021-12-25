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
      fontWeight: '700',
    },
    divider: {
      height: 3,
      backgroundColor: 'white',
      marginBottom: '5%',
    },
    section: {
      flexGrow: 1,
    },
    input: {
      alignItems: 'flex-start',
      marginBottom: '2.5%',
    },
  });
};
