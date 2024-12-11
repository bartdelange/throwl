import { StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const makeStyles = () => {
    const { colors } = useAppTheme();

    return StyleSheet.create({
        graph: {
            aspectRatio: 1,
            backgroundColor: 'red',
        },
        legend: {
            flexDirection: 'row',
            padding: 15,
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
    });
};
