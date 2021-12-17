import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const makeStyles = () => {
  const { colors } = useTheme();

  return StyleSheet.create({
    container: {
      marginTop: 16,
      backgroundColor: colors.accent,
      padding: 16,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 2,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    content: {
      overflow: 'hidden',
      backgroundColor: colors.accent,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
  });
};
