import { StyleSheet } from 'react-native';
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
      maxWidth: 500,
      width: '90%',
      minHeight: 100,
      maxHeight: '90%',
      alignItems: 'center',
      elevation: 4,
      borderRadius: 10,
    },
    closeIcon: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 50,
      height: 50,
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
      flexGrow: 1,
      marginVertical: 10,
      paddingBottom: 10,
    },
    subTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    actionsWrapper: {
      justifyContent: 'center',
      flexGrow: 1,
      marginVertical: 10,
      paddingBottom: 10,
    },
  });
};
