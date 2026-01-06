import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = () => {
  const { colors } = useAppTheme();

  return StyleSheet.create({
    player: {
      paddingVertical: 5,
      color: 'white',
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
      fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
    },
    iconStyle: {
      borderColor: 'white',
      borderRadius: Dimensions.get('window').width * 0.01,
    },
    positionStyle: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.secondary,
      aspectRatio: 1,
      color: colors.primary,
      paddingBottom: 2,
      borderRadius: Dimensions.get('window').width / 2,
      height: Math.max(Dimensions.get('window').width * 0.03, 18),
      width: Math.max(Dimensions.get('window').width * 0.03, 18),
    },
    positionTextStyle: {
      textAlign: 'center',
      includeFontPadding: false,
      paddingTop: Dimensions.get('window').width * 0.005,
      color: 'white',
      fontSize: Math.max(Dimensions.get('window').width * 0.03, 18),
    },
  });
};
