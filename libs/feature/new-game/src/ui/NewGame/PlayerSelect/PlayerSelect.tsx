import { RouteProp, useNavigation } from '@react-navigation/core';
import { useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Menu, Text } from 'react-native-paper';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { AppModal, LogoButton, FormInput, AppHeader } from '@throwl/shared-ui';
import {
  DOUBLES_GAME_SCREEN,
  HOME_SCREEN,
  NORMAL_GAME_SCREEN,
  RootStackParamList,
  serializePlayerParam,
} from '@throwl/shared-constants';
import { useAuthContext } from '@throwl/feature-auth';
import {
  Friend,
  GuestUser,
  MAX_GAME_PLAYERS,
  User,
  TeamRoster,
  validRoster,
  gamePlayerId,
} from '@throwl/shared-domain-models';
import { PlayerItem } from './components/PlayerItem/PlayerItem';
import { useAppTheme } from '@throwl/shared-theme';
import { GameService } from '@throwl/shared-data-access-game';
import { useStyles } from './PlayerSelect.styles';
import { useNewGame } from '../../../feature/NewGameContext';
import { TeamSetup, shuffled } from './TeamSetup';
import { NewGameScreenLayout } from '../NewGameScreenLayout';

export const PlayerSelectScreen = () => {
  const { width } = useWindowDimensions();
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state } = useNewGame();

  const route = useRoute<RouteProp<RootStackParamList, 'NEW_GAME'>>();
  const { user } = useAuthContext();
  const [selectedUsers, _setSelectedUsers] = useState<string[]>(
    (route.params?.selectedUsers || []).slice(0, MAX_GAME_PLAYERS),
  );
  const [teams, setTeams] = useState<TeamRoster | undefined>(
    route.params?.teams,
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
        _setSelectedUsers(selectedUsers.slice(0, MAX_GAME_PLAYERS));
      } else {
        _setSelectedUsers((current) => {
          return selectedUsers(current).slice(0, MAX_GAME_PLAYERS);
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
    setSelectedUsers(shuffled(selectedUsers));
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
      ...(user.friends || [])
        .filter((friend) => friend.confirmed)
        .map<User>((friend: Friend) => ({
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

  const selectedPlayers = selectedUsers.flatMap((id) => {
    const player = players.find((candidate) => gamePlayerId(candidate) === id);
    return player ? [player] : [];
  });
  const selectedIds = selectedPlayers.map(gamePlayerId);
  const rosterIsValid =
    teams &&
    selectedIds.length === selectedUsers.length &&
    validRoster(selectedIds, teams) &&
    selectedIds.every(
      (id) =>
        players.filter((player) => gamePlayerId(player) === id).length === 1,
    );
  const startGameButton = (
    <LogoButton
      label="GO"
      size={Math.max(50, width * 0.1)}
      disabled={!selectedUsers.length || Boolean(teams && !rosterIsValid)}
      onPress={() => {
        if (teams && !rosterIsValid) return;
        navigator.setParams({ selectedUsers, guestUsers });
        const mappedPlayers = selectedPlayers;
        switch (state.options?.mode) {
          case 'x01':
            navigator.push(NORMAL_GAME_SCREEN, {
              players: mappedPlayers.map(serializePlayerParam),
              ...(teams ? { teams } : {}),
              options: {
                mode: 'x01',
                startingScore: state.options.startingScore,
              },
            });
            break;
          case 'doubles':
            navigator.push(DOUBLES_GAME_SCREEN, {
              players: mappedPlayers.map(serializePlayerParam),
              ...(teams ? { teams } : {}),
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
  );

  return (
    <>
      <NewGameScreenLayout action={startGameButton} scrollable={false}>
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
                    size={Math.max(50, width * 0.1)}
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
        <TeamSetup
          teams={teams}
          players={selectedPlayers.map((player) => ({
            id: gamePlayerId(player),
            name: player.name,
          }))}
          rosterIsValid={Boolean(rosterIsValid)}
          onChange={setTeams}
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
                        }
                        if (current.length >= MAX_GAME_PLAYERS) return current;
                        return [...current, subbedPlayer.id];
                      })
                    }
                  />
                </View>
              );
            }}
          />
        </View>
      </NewGameScreenLayout>
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
    </>
  );
};
