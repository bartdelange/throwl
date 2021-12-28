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
    content: { flex: 1 },
    dartboardWrapper: {
      padding: width * 0.025,
      aspectRatio: 1,
      width: '100%',
      position: 'relative',
    },
    missText: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      color: colors.primary,
      fontWeight: '700',
      fontSize: textSize,
      height: (textSize / 5) * 4,
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
      paddingTop: textSize * 0.1,
      height: textSize + textSize * 0.2,
    },
    currentThrowNumberText: {
      textAlignVertical: 'bottom',
      fontSize: textSize,
    },
    currentThrowNumberTextSuperScript: {
      textAlignVertical: 'top',
      fontSize: textSize * 0.6,
      lineHeight: textSize * 0.6 * 1.1,
    },
    currentThrowScoreText: {
      paddingLeft: textSize * 0.5,
      fontSize: textSize,
      fontWeight: '700',
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
      height: textSize * 0.5,
      lineHeight: textSize * 0.6,
      flex: 1,
    },
    scoreTableBoldCell: {
      fontWeight: '700',
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
