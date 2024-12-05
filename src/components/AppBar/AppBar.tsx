import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import React from 'react';
import { Appbar, Menu } from 'react-native-paper';
import {
    FRIENDS_SCREEN,
    PROFILE_SCREEN,
    UNAUTHENTICATED_SCREEN,
} from '~/constants/navigation';
import { AuthContext } from '~/context/AuthContext';
import { useAppTheme } from '~/App/theming.tsx';

interface AppBarProps extends NativeStackHeaderProps {}

export const AppBar: React.FC<AppBarProps> = ({
    navigation,
    back,
}: AppBarProps) => {
    const [visible, setVisible] = React.useState(false);
    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);
    const { logout } = React.useContext(AuthContext);
    const { colors } = useAppTheme();

    const menuItemTheme = React.useMemo(
        () => ({ colors: { onSurface: colors.onSurfaceVariant } }),
        [colors]
    );

    return (
        <Appbar.Header
            style={{ backgroundColor: colors.background, elevation: 0 }}>
            {back ? (
                <Appbar.BackAction color="white" onPress={navigation.goBack} />
            ) : null}
            <Appbar.Content title="" />
            {!back ? (
                <Menu
                    visible={visible}
                    onDismiss={closeMenu}
                    anchor={
                        <Appbar.Action
                            icon="menu"
                            color="white"
                            onPress={openMenu}
                        />
                    }>
                    <Menu.Item
                        leadingIcon="account-multiple"
                        onPress={() => {
                            navigation.push(FRIENDS_SCREEN);
                            closeMenu();
                        }}
                        title="FRIENDS"
                        theme={menuItemTheme}
                    />
                    <Menu.Item
                        leadingIcon="tune"
                        onPress={() => {
                            navigation.push(PROFILE_SCREEN);
                            closeMenu();
                        }}
                        title="SETTINGS"
                        theme={menuItemTheme}
                    />
                    <Menu.Item
                        leadingIcon="logout-variant"
                        onPress={() => {
                            logout();
                            navigation.replace(UNAUTHENTICATED_SCREEN);
                        }}
                        title="SIGN OUT"
                        theme={menuItemTheme}
                    />
                </Menu>
            ) : null}
        </Appbar.Header>
    );
};
