import { Platform, StyleSheet } from 'react-native';

export const makeStyles = () =>
    StyleSheet.create({
        layout: {
            flexDirection: 'column',
            alignContent: 'center',
            alignItems: 'center',
        },
        content: {
            paddingHorizontal: '10%',
            paddingBottom: '5%',
            height: '100%',
            flexShrink: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '5%',
            marginTop: '15%',
        },
        firstHeader: {
            marginTop: 0,
        },
        heading: {
            fontSize: 48,
            flex: 1,
            marginRight: '25%',
            includeFontPadding: true,
            ...Platform.select({
                default: {
                    fontWeight: 'bold',
                },
                android: {
                    fontFamily: 'Karbon-Bold',
                },
            }),
        },
        divider: {
            height: 3,
            backgroundColor: 'white',
            marginBottom: '5%',
        },
        section: {
            flexGrow: 1,
            paddingVertical: '10%',
        },
        input: {
            alignItems: 'flex-start',
            marginBottom: '2.5%',
        },
    });
