import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const makeStyles = (labelColor?: string) => {
    const { colors } = useAppTheme();

    return StyleSheet.create({
        wrapper: {
            position: 'relative',
            alignItems: 'center',
            alignContent: 'center',
            justifyContent: 'center',
        },
        text: {
            fontSize: Math.max(Dimensions.get('window').width * 0.04, 24),
            ...Platform.select({
                default: {
                    fontWeight: 'bold',
                },
                android: {
                    fontFamily: 'Karbon-Bold',
                },
            }),
            color: labelColor ?? '#FFFFFF',
        },
        input: {
            paddingVertical: 10,
            paddingHorizontal: 15,
            marginTop: 5,
            marginBottom: 10,
            fontSize: 16,
            borderRadius: 100,
            minWidth: '100%',
            backgroundColor: '#FFF',
            color: colors.primary,
        },
    });
};
