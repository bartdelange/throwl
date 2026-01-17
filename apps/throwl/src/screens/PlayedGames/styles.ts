import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '../../App/theming';

export const useStyles = () => {
  const { colors } = useAppTheme();
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
      marginTop: 50,
      height: 3,
      backgroundColor: colors.onBackground,
    },
    list: {
      height: '80%',
      marginVertical: height * 0.05,
    },
    listItem: {
      flexDirection: 'row',
      backgroundColor: colors.background,
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
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
    },
    listItemGameTimes: {
      fontSize: textSize / 2,
    },
  });
};
