import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import React from 'react';
import { Appbar, Menu, useTheme } from 'react-native-paper';
import {
  FRIENDS_SCREEN,
  PROFILE_SCREEN,
  UNAUTHENTICATED_SCREEN,
} from '~/constants/navigation';
import { AuthContext } from '~/context/AuthContext';

interface AppBarProps extends NativeStackHeaderProps {}

export const AppBar: React.FC<AppBarProps> = ({
  navigation,
  back,
}: AppBarProps) => {
  const [visible, setVisible] = React.useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const { logout } = React.useContext(AuthContext);
  const { colors } = useTheme();

  return (
    <Appbar.Header style={{ backgroundColor: colors.background, elevation: 0 }}>
      {back ? (
        <Appbar.BackAction color="white" onPress={navigation.goBack} />
      ) : null}
      <Appbar.Content title="" />
      {!back ? (
        <Menu
          visible={visible}
          onDismiss={closeMenu}
          anchor={
            <Appbar.Action icon="menu" color="white" onPress={openMenu} />
          }>
          <Menu.Item
            icon="account-multiple"
            onPress={() => {
              navigation.push(FRIENDS_SCREEN);
              closeMenu();
            }}
            title="FRIENDS"
          />
          <Menu.Item
            icon="tune"
            onPress={() => {
              navigation.push(PROFILE_SCREEN);
              closeMenu();
            }}
            title="SETTINGS"
          />
          <Menu.Item
            icon="logout-variant"
            onPress={() => {
              logout();
              navigation.replace(UNAUTHENTICATED_SCREEN);
            }}
            title="SIGN OUT"
          />
        </Menu>
      ) : null}
    </Appbar.Header>
  );
};
