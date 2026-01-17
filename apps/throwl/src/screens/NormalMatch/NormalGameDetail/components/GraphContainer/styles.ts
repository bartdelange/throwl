import { StyleSheet } from 'react-native';
import { useAppTheme } from '../../../../../App/theming';

export const useStyles = () => {
  const { colors } = useAppTheme();

  return StyleSheet.create({
    graph: {
      aspectRatio: 1,
      overflow: 'hidden',
      marginTop: 32,
      marginLeft: -8,
      padding: 0,
    },
    legend: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    legendEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    legendText: {
      color: colors.primary,
    },
    legendBall: {
      height: 10,
      aspectRatio: 1,
      borderRadius: 10,
      marginRight: 10,
    },
    tooltip: {
      height: 50,
      width: 120,
      marginLeft: 24,
      backgroundColor: colors.background,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tooltipTextHeader: {
      fontSize: 18,
      color: colors.onBackground,
    },
    tooltipText: {
      fontSize: 12,
      color: colors.onBackground,
    },
  });
};
