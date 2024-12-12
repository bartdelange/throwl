import { Dimensions, StyleSheet } from 'react-native';

export const makeStyles = () =>
    StyleSheet.create({
        layout: {
            flexDirection: 'column',
            alignContent: 'center',
            alignItems: 'center',
        },
        logo: {
            paddingTop: '20%',
            paddingBottom: '20%',
            width: Math.max(Dimensions.get('window').width * 0.25, 100),
        },
        userWelcome: {
            paddingHorizontal: '20%',
            fontSize: 172,
            justifyContent: 'center',
            textAlign: 'center',
        },
        homeContent: {
            flex: 1,
            justifyContent: 'center',
        },
        buttons: {
            paddingVertical: 10,
        },
    });
