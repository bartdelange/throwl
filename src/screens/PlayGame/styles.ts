import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const makeStyles = () => {
  const { colors } = useAppTheme();
  const { width, height } = Dimensions.get('window');

  const textSize = Math.max(width * 0.05, 30);

  return StyleSheet.create({
    layout: {
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
    },
    backButton: { position: 'absolute', top: 0, left: 0 },
    content: { flex: 1 },
    dartboardWrapper: {
      padding: width * 0.025,
      aspectRatio: 1,
      width: '100%',
      position: 'relative',
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
    scoreWrapper: {
      flex: 1,
      backgroundColor: colors.primary,
      borderTopStartRadius: 25,
      borderTopEndRadius: 25,
      alignItems: 'center',
    },
    currentTurnScoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: height * 0.015,
      width: width * 0.8,
    },
    currentTurnScoreActiveThrow: {},
    currentThrowContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    currentThrowNumberText: {
      fontSize: textSize * 0.5,
    },
    currentThrowNumberTextSuperScript: {
      fontSize: textSize * 0.8 * 0.4,
    },
    currentThrowScoreText: {
      paddingLeft: width * 0.02,
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
    undoButton: {
      transform: [{ rotateZ: '45deg' }],
      backgroundColor: colors.onSurface,
      color: colors.primary,
    },
    scoreTable: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.primary,
    },
    scoreTableHead: {
      borderTopWidth: 1,
      borderTopColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: 'white',
      width: '90%',
      alignSelf: 'center',
      height: textSize * 1.25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreTableRow: {
      height: textSize * 1.25,
      alignItems: 'center',
      position: 'relative',
      paddingLeft: width * 0.05,
      backgroundColor: colors.primary,
    },
    scoreTableCol: {
      flexDirection: 'row',
    },
    scoreTableCell: {
      fontSize: textSize * 0.5,
      flex: 1,
    },
    scoreTableBoldCell: {
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
    },
    scoreTableCenterCell: {
      textAlign: 'center',
    },
    activeUserIconRow: {
      height: 0,
    },
    activeUserIcon: {
      position: 'absolute',
      left: width * 0.02,
    },
  });
};
