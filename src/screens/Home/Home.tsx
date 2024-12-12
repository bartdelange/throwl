import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Dimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppLogoLight } from '~/components/AppLogo';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import {
    NEW_GAME_SCREEN,
    PLAYED_GAMES_SCREEN,
    RootStackParamList,
} from '~/constants/navigation';
import { AuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { makeStyles } from './styles';

export const HomeScreen = () => {
    const { user } = React.useContext(AuthContext);
    const { width } = Dimensions.get('window');
    const styles = makeStyles();
    const navigator =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <FullScreenLayout style={styles.layout}>
            <View style={styles.logo}>
                <AppLogoLight />
            </View>
            <Text
                numberOfLines={1}
                allowFontScaling={false}
                adjustsFontSizeToFit={true}
                style={styles.userWelcome}>
                Hi {user?.name}!
            </Text>
            <View style={styles.homeContent}>
                <LogoButton
                    label="NEW GAME"
                    icon="plus"
                    size={Math.min(width * 0.1, 100)}
                    style={styles.buttons}
                    onPress={() =>
                        navigator.push(NEW_GAME_SCREEN, { selectedUsers: [] })
                    }
                />
                <LogoButton
                    label="PLAYED GAMES"
                    icon="history"
                    size={Math.min(width * 0.1, 100)}
                    style={styles.buttons}
                    onPress={() => navigator.push(PLAYED_GAMES_SCREEN)}
                />
            </View>
        </FullScreenLayout>
    );
};
