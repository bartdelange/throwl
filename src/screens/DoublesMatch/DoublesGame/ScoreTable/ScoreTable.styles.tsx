import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const { width } = Dimensions.get('window');

  const textSize = Math.max(width * 0.05, 30);

  return StyleSheet.create({
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
