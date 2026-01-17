import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import React, { FC, useMemo, useState } from 'react';
import { Appbar, Menu } from 'react-native-paper';
import {
  FRIENDS_SCREEN,
  PROFILE_SCREEN,
  UNAUTHENTICATED_SCREEN,
} from '../../constants/navigation';
import { useAuthContext } from '../../context/AuthContext';
import { useAppTheme } from '../../App/theming';
import { useStyles } from './AppBar.styles';

export const AppBar: FC<NativeStackHeaderProps> = ({
  navigation,
  back,
}: NativeStackHeaderProps) => {
  const [visible, setVisible] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const { logout } = useAuthContext();
  const { colors } = useAppTheme();
  const styles = useStyles();

  const menuItemTheme = useMemo(
    () => ({ colors: { onSurface: colors.onSurfaceVariant } }),
    [colors],
  );

  return (
    <Appbar.Header style={styles.header}>
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
          }
        >
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
              void logout();
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
