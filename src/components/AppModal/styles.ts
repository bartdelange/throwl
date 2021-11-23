import { Dimensions, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const makeStyles = () => {
  const { colors } = useTheme();
  return StyleSheet.create({
    modalContainer: {
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'center',
    },
    surface: {
      backgroundColor: 'white',
      padding: 20,
      alignContent: 'center',
      alignItems: 'center',
      minWidth: Dimensions.get('window').width * 0.5,
      width: 500,
      maxWidth: '90%',
      elevation: 4,
      borderRadius: 10,
      borderWidth: 1,
    },
    closeIcon: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 50,
      height: 50,
      backgroundColor: 'white',
    },
    titleWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.success,
      marginVertical: 10,
      paddingBottom: 10,
      marginRight: 10,
    },
    title: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.success,
      marginVertical: 10,
    },
    subTitleWrapper: {
      justifyContent: 'center',
      marginVertical: 10,
      paddingBottom: 10,
    },
    subTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    customContentWrapper: {
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'stretch',
      alignSelf: 'stretch',
      flexGrow: 1,
    },
    actionsWrapper: {
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'stretch',
      alignSelf: 'stretch',
      flexGrow: 1,
    },
  });
};
