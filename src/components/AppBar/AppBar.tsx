import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import React from 'react';
import { Appbar, Menu, Text, useTheme } from 'react-native-paper';
import { UNAUTHENTICATED_SCREEN } from '~/constants/navigation';
import { AuthContext } from '~/context/AuthContext';
import { AppModal } from '~/components/AppModal/AppModal';
import { Dimensions, View } from 'react-native';
import { Swipeable } from '~/components/Swipeable/Swipeable';
import { UserService } from '~/services/user_service';

interface AppBarProps extends NativeStackHeaderProps {}

export const AppBar: React.FC<AppBarProps> = ({
  navigation,
  back,
}: AppBarProps) => {
  const { user } = React.useContext(AuthContext);
  const [friendsOpen, setFriendsOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const { logout } = React.useContext(AuthContext);
  const { colors } = useTheme();

  return (
    <Appbar.Header style={{ backgroundColor: colors.background }}>
      <AppModal
        titleIcon="account-group"
        visible={friendsOpen}
        title="Friends"
        onDismiss={() => setFriendsOpen(false)}
        customContent={
          <View>
            {(user?.friends || []).map((friend, i) => (
              <Swipeable
                key={friend.user.id}
                bounce={i == 0}
                rightActions={[
                  {
                    icon: 'delete',
                    onPress: () =>
                      user && UserService.removeFriend(user.id, friend.user.id),
                  },
                ]}>
                <View
                  style={{
                    flex: 1,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    backgroundColor: 'white',
                    width: '100%',
                  }}>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: Math.min(
                        48,
                        Dimensions.get('window').width * 0.09
                      ),
                    }}>
                    {friend.user.name}
                  </Text>
                </View>
              </Swipeable>
            ))}
          </View>
        }
      />
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
              closeMenu();
              setFriendsOpen(true);
            }}
            title="FRIENDS"
          />
          <Menu.Item
            icon="bell"
            onPress={() => {
              console.log('Option 3 was pressed');
            }}
            title="NOTIFICATIONS"
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
