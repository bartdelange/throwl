import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const makeStyles = (textSize: number) => {
  const { colors } = useTheme();
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
      aspectRatio: 1,
      height: '33%',
      position: 'relative',
      alignSelf: 'center',
    },
    playerListWrapper: {
      flex: 1,
      backgroundColor: colors.primary,
      borderTopStartRadius: 25,
      borderTopEndRadius: 25,
      alignItems: 'center',
      paddingTop: textSize * 0.1,
      borderWidth: 1,
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
      borderBottomColor: 'white',
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
      height: 350,
      flex: 1,
      paddingTop: 0,
      padding: height * 0.0125,
    },
    graphContainer: {
      height: 350,
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
