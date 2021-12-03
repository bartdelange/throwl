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
    },
    playerList: {
      paddingVertical: height * 0.025,
      paddingHorizontal: height * 0.025,
      width: '100%',
    },
    playerListRow: {
      borderBottomColor: 'white',
      borderBottomWidth: 2,
      paddingVertical: height * 0.025,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignContent: 'center',
    },
    playerName: {
      paddingTop: 1,
      fontSize: textSize,
      lineHeight: textSize,
      fontWeight: '700',
      borderWidth: 1,
      flex: 1,
    },
    scoreSegment: {
      paddingTop: 1,
      paddingLeft: height * 0.025,
      lineHeight: textSize,
      borderWidth: 1,
      fontSize: textSize,
    },
    arrowDown: {
      paddingLeft: height * 0.025,
      borderWidth: 1,
      fontSize: textSize,
    },
  });
};
