import { Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const makeStyles = () => {
    const { colors } = useAppTheme();

    return StyleSheet.create({
        modalContainer: {
            padding: 20,
            width: '100%',
        },
        surface: {
            alignItems: 'center',
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
        },
        titleWrapper: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: '90%',
        },
        icon: {
            fontSize: 48,
            ...Platform.select({
                default: {
                    fontWeight: 'bold',
                },
                android: {
                    fontFamily: 'Karbon-Bold',
                },
            }),
            color: colors.success,
            marginVertical: 10,
            paddingBottom: 10,
            marginRight: 15,
        },
        title: {
            fontSize: 48,
            ...Platform.select({
                default: {
                    fontWeight: 'bold',
                },
                android: {
                    fontFamily: 'Karbon-Bold',
                },
            }),
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
            ...Platform.select({
                default: {
                    fontWeight: 'bold',
                },
                android: {
                    fontFamily: 'Karbon-Bold',
                },
            }),
            color: colors.primary,
            textAlign: 'center',
        },
        customContentWrapper: {
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'stretch',
            alignSelf: 'stretch',
            flexGrow: 1,
            width: '100%',
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
