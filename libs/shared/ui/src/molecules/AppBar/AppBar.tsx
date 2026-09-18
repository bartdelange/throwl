import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { FC, useMemo, useState } from 'react';
import { Appbar, Menu } from 'react-native-paper';
import { UNAUTHENTICATED_SCREEN } from '@throwl/shared-constants';
import { useAppTheme } from '@throwl/shared-theme';
import { AppbarBackAction } from '../../atoms/AppbarBackAction/AppbarBackAction';
import { useStyles } from './AppBar.styles';

interface AppBarProps extends NativeStackHeaderProps {
  onFriendsPress: () => void;
  onSettingsPress: () => void;
  onSignOut: () => void;
}

export const AppBar: FC<AppBarProps> = ({
  navigation,
  back,
  onFriendsPress,
  onSettingsPress,
  onSignOut,
}: AppBarProps) => {
  const [visible, setVisible] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const { colors } = useAppTheme();
  const styles = useStyles();

  const menuItemTheme = useMemo(
    () => ({ colors: { onSurface: colors.onSurfaceVariant } }),
    [colors],
  );

  return (
    <Appbar.Header style={styles.header}>
      {back ? (
        <AppbarBackAction color="white" onPress={navigation.goBack} />
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
              onFriendsPress();
              closeMenu();
            }}
            title="FRIENDS"
            theme={menuItemTheme}
          />
          <Menu.Item
            leadingIcon="tune"
            onPress={() => {
              onSettingsPress();
              closeMenu();
            }}
            title="SETTINGS"
            theme={menuItemTheme}
          />
          <Menu.Item
            leadingIcon="logout-variant"
            onPress={() => {
              onSignOut();
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
