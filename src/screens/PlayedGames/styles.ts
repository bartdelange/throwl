import { Dimensions, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const makeStyles = () => {
  const { colors } = useTheme();
  const { width, height } = Dimensions.get('window');

  const textSize = Math.max(width * 0.04, 24);

  return StyleSheet.create({
    layout: {
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
    },
    backButton: { position: 'absolute', top: 0, left: 0 },
    content: { flex: 1, width: '80%' },
    heading: {
      fontSize: textSize,
      paddingRight: '25%',
      includeFontPadding: false,
      fontWeight: '700',
    },
    divider: {
      marginTop: 50,
      height: 3,
      backgroundColor: 'white',
    },
    list: {
      height: '80%',
      marginVertical: height * 0.05,
    },
    listItem: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: height * 0.02,
      paddingHorizontal: width * 0.02,
      alignItems: 'center',
    },
    listItemIcon: {
      fontSize: textSize,
      marginRight: Math.min(width * 0.05, 50),
    },
    listItemGameState: {
      fontSize: textSize,
      fontWeight: '700',
    },
    listItemGameTimes: {
      fontSize: textSize / 2,
      fontWeight: '200',
    },
  });
};
