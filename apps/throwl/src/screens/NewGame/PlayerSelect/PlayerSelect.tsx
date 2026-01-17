import { RouteProp, useNavigation } from '@react-navigation/core';
import { useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, FlatList, TouchableOpacity, View } from 'react-native';
import { Menu, Text } from 'react-native-paper';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { AppModal } from '../../../components/AppModal/AppModal';
import { LogoButton } from '../../../components/LogoButton/LogoButton';
import {
  DOUBLES_GAME_SCREEN,
  HOME_SCREEN,
  NORMAL_GAME_SCREEN,
  RootStackParamList,
} from '../../../constants/navigation';
import { useAuthContext } from '../../../context/AuthContext';
import { Friend, GuestUser, User } from '@throwl/shared-domain-models';
import { PlayerItem } from './components/PlayerItem/PlayerItem';
import { useAppTheme } from '../../../App/theming';
import { GameService } from '../../../services/game_service';
import { FormInput } from '../../../components/FormInput/FormInput';
import { useStyles } from './PlayerSelect.styles';
import { useNewGame } from '../../../context/NewGameContext';
import { AppHeader } from '../../../components/AppHeader/AppHeader';
import { FullScreenLayout } from '../../../layouts/FullScreen/FullScreen';

export const PlayerSelectScreen = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state } = useNewGame();

  const route = useRoute<RouteProp<RootStackParamList, 'NEW_GAME'>>();
  const { user } = useAuthContext();
  const [selectedUsers, _setSelectedUsers] = useState<string[]>(
    route.params?.selectedUsers || [],
  );
  const [guestUsers, setGuestUsers] = useState<string[]>(
    route.params?.guestUsers || [],
  );
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState<string>('');
  const { colors } = useAppTheme();
  const menuItemTheme = useMemo(
    () => ({ colors: { onSurface: colors.onSurfaceVariant } }),
    [colors],
  );

  const setSelectedUsers = useCallback(
    (selectedUsers: string[] | ((current: string[]) => string[])) => {
      if (Array.isArray(selectedUsers)) {
        _setSelectedUsers(selectedUsers);
      } else {
        _setSelectedUsers((current) => {
          return selectedUsers(current);
        });
      }
    },
    [],
  );
  const [visible, setVisible] = useState(false);
  const styles = useStyles();
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const randomizeSelected = () => {
    setVisible(false);
    const newArray = selectedUsers.map((u) => u);
    let currentIndex = newArray.length;
    let randomIndex = 0;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex],
        newArray[currentIndex],
      ];
    }

    setSelectedUsers(newArray);
  };

  const addGuest = useCallback(() => {
    if (guestName) {
      setGuestUsers((current) => {
        return [...current, guestName];
      });
      setGuestName('');
      setAddGuestOpen(false);
    }
  }, [setGuestUsers, setGuestName, guestName]);

  const players = useMemo<(Omit<User, 'friends'> | GuestUser)[]>(() => {
    if (!user) {
      return [];
    }

    return [
      { ...user, type: 'user', friends: undefined },
      ...(user.friends || []).map<User>((friend: Friend) => ({
        ...friend.user,
        type: 'user',
      })),
      ...guestUsers.map<GuestUser>((guestUser) => ({
        type: 'guest_user',
        name: guestUser,
      })),
    ];
  }, [user, guestUsers]);

  if (!user) {
    navigator.replace(HOME_SCREEN);
    return <View />;
  }

  return (
    <FullScreenLayout size="fullscreen" style={styles.layout}>
      <View style={styles.content}>
        <AppHeader
          title="The Players"
          right={
            <Menu
              visible={visible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity onPress={openMenu}>
                  <MaterialDesignIcons
                    name="menu"
                    color="white"
                    size={Math.max(50, Dimensions.get('window').width * 0.1)}
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                leadingIcon="dice-multiple"
                onPress={randomizeSelected}
                title="RANDOMIZE PLAYERS"
                theme={menuItemTheme}
              />
              <Menu.Item
                leadingIcon="account-multiple"
                onPress={() => {
                  setVisible(false);
                  setSelectedUsers([]);
                  setGuestUsers([]);
                }}
                title="CLEAR"
                theme={menuItemTheme}
              />
              <Menu.Item
                leadingIcon="account-edit"
                onPress={() => {
                  setVisible(false);
                  setAddGuestOpen(true);
                }}
                title="ADD A GUEST"
                theme={menuItemTheme}
              />
            </Menu>
          }
        />
        <View style={styles.playerList}>
          <FlatList<Omit<User, 'friends'> | GuestUser>
            data={players}
            keyExtractor={(player) => GameService.stubPlayer(player).id}
            ListEmptyComponent={
              <Text style={styles.header}>
                You have not added any friends yet, you can also add a guest
                using the menu above
              </Text>
            }
            renderItem={({ item: player }) => {
              const subbedPlayer = GameService.stubPlayer(player);
              return (
                <View style={styles.player}>
                  <PlayerItem
                    player={subbedPlayer}
                    selected={selectedUsers.includes(subbedPlayer.id)}
                    position={selectedUsers.indexOf(subbedPlayer.id) + 1}
                    onPress={() =>
                      setSelectedUsers((current) => {
                        if (current.indexOf(subbedPlayer.id) >= 0) {
                          return current.filter(
                            (userId) => userId !== subbedPlayer.id,
                          );
                        } else {
                          return [...current, subbedPlayer.id];
                        }
                      })
                    }
                  />
                </View>
              );
            }}
          />
        </View>
      </View>
      <View style={styles.goButton}>
        <LogoButton
          label="GO"
          size={Math.max(50, Dimensions.get('window').width * 0.1)}
          disabled={!selectedUsers.length}
          onPress={() => {
            navigator.setParams({ selectedUsers, guestUsers });
            const mappedPlayers = [
              ...(selectedUsers
                .map<
                  Omit<User, 'friends'> | GuestUser | undefined
                >((selectedUser) => players.find((p) => GameService.stubPlayer(p).id === selectedUser))
                .filter(Boolean) as (Omit<User, 'friends'> | GuestUser)[]),
            ];

            switch (state.options?.mode) {
              case 'x01':
                navigator.push(NORMAL_GAME_SCREEN, {
                  players: mappedPlayers,
                  options: {
                    mode: 'x01',
                    startingScore: state.options.startingScore,
                  },
                });
                break;
              case 'doubles':
                navigator.push(DOUBLES_GAME_SCREEN, {
                  players: mappedPlayers,
                  options: {
                    mode: 'doubles',
                    endOnInvalid: state.options.endOnInvalid,
                    skipBull: state.options.skipBull,
                    quickMatch: state.options.quickMatch,
                  },
                });
                break;
            }
          }}
        />
      </View>
      <AppModal
        visible={addGuestOpen}
        titleIcon="account-edit"
        title="ADD A GUEST"
        onDismiss={() => setAddGuestOpen(false)}
        actions={
          <View>
            <FormInput
              style={styles.input}
              label=""
              placeholder="John Doe"
              onChangeText={setGuestName}
            />
            <LogoButton
              mode="light"
              label="ADD"
              onPress={addGuest}
              style={styles.button}
            />
          </View>
        }
      />
    </FullScreenLayout>
  );
};
