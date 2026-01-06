import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = (textSize: number) => {
  const { colors } = useAppTheme();
  const { width, height } = Dimensions.get('window');

  return StyleSheet.create({
    layout: {
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
    },
    backButton: { position: 'absolute', top: 0, left: 0 },
    content: { flex: 1, width: '100%' },
    dartboardWrapper: {
      padding: width * 0.025,
      height: '33%',
      position: 'relative',
      // alignSelf: 'center',
    },
    dartboard: {
      padding: width * 0.025,
      aspectRatio: 1,
      position: 'relative',
      alignSelf: 'center',
    },
    missText: {
      position: 'absolute',
      right: width * 0.025,
      bottom: width * 0.025,
      color: colors.primary,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
      fontSize: textSize,
      height: textSize,
      includeFontPadding: false,
    },
    playerListWrapper: {
      flex: 1,
      backgroundColor: colors.primary,
      borderTopStartRadius: 25,
      borderTopEndRadius: 25,
      alignItems: 'center',
      paddingTop: textSize * 0.1,
    },
    playerList: {
      marginTop: height * 0.025,
      paddingHorizontal: height * 0.025,
      width: '100%',
      borderBottomStartRadius: 25,
      borderBottomEndRadius: 25,
    },
    rowBorderWrapper: {
      backgroundColor: colors.primary,
      borderBottomColor: colors.onPrimary,
      borderBottomWidth: 2,
    },
    accordion: {
      marginVertical: height * 0.0125,
    },
    playerName: {
      paddingTop: 1,
      fontSize: textSize,
      lineHeight: textSize,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
      flex: 1,
      color: colors.primary,
    },
    scoreText: {
      lineHeight: textSize * 0.75,
      fontSize: textSize * 0.75,
      ...Platform.select({
        default: {
          fontWeight: 'normal',
        },
        android: {
          fontFamily: 'Karbon-Regular',
        },
      }),
      color: colors.primary,
    },
    arrow: {
      paddingLeft: height * 0.025,
      fontSize: textSize,
    },
    accordionContent: {
      margin: height * 0.0125,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    statsContainer: {
      flex: 1,
      paddingTop: 0,
      padding: height * 0.0125,
    },
    graphContainer: {
      flex: 1,
      paddingTop: 0,
      padding: height * 0.0125,
      aspectRatio: 1,
      minWidth: width < 500 ? width - height * 0.075 : 0, // width - all the margin/padding applied above
    },
    graph: {
      backgroundColor: colors.primary,
      aspectRatio: 1,
    },
  });
};
