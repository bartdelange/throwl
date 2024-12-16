import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const makeStyles = () => {
    const { colors } = useAppTheme();
    return StyleSheet.create({
        layout: {
            flexDirection: 'column',
            alignContent: 'center',
            alignItems: 'center',
        },
        content: {
            width: '80%',
            paddingTop: '10%',
            flexShrink: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '10%',
        },
        heading: {
            fontSize: 72,
            flex: 1,
            paddingRight: '25%',
            includeFontPadding: false,
            ...Platform.select({
                default: {
                    fontWeight: 'bold',
                },
                android: {
                    fontFamily: 'Karbon-Bold',
                },
            }),
        },
        menuButton: {
            alignSelf: 'flex-end',
            backgroundColor: 'transparent',
            borderRadius: 10000,
            paddingBottom: 5,
        },
        divider: {
            height: 3,
            backgroundColor: 'white',
        },
        playerList: {
            paddingTop: '10%',
            paddingBottom: Dimensions.get('window').width < 500 ? 0 : '5%',
            maxHeight: '80%',
        },
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
        scoreInput: {
            height:
                (Math.max(Dimensions.get('window').height * 0.06, 55) + 15) * 6,
        },
        scoreButton: {
            margin: 10,
            borderWidth: 2,
            borderRadius: 10,
            alignItems: 'center',
            alignContent: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            height: Math.max(Dimensions.get('window').height * 0.06, 50),
            borderColor: colors.primary,
        },
        scorePreviewWrapper: {
            flex: 2.4,
        },
        scoreRemoveButton: {
            textAlign: 'center',
            color: colors.primary,
            fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
        },
        scoreButtonText: {
            textAlign: 'center',
            includeFontPadding: false,
            color: colors.primary,
            fontSize: Math.max(Dimensions.get('window').width * 0.05, 24),
        },
        goButton: {
            flex: 1,
            justifyContent: 'space-evenly',
            alignItems: 'center',
            width: '80%',
            minHeight: '20%',
            paddingVertical: Dimensions.get('window').width < 500 ? 0 : '5%',
        },

        input: {
            marginVertical: '5%',
            width: '75%',
            alignSelf: 'center',
        },
        button: {
            marginBottom: '10%',
            alignSelf: 'center',
        },
    });
};
