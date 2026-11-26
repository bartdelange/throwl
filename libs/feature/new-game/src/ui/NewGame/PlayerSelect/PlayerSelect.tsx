import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { AppModal, LogoButton, FormInput, AppHeader } from '@throwl/shared-ui';
import {
  HOME_SCREEN,
  RootStackParamList,
  serializePlayerParam,
} from '@throwl/shared-constants';
import { useAuthContext } from '@throwl/feature-auth';
import {
  Friend,
  GuestUser,
  MAX_GAME_PLAYERS,
  User,
  teamCounts,
  validGuestName,
  gamePlayerId,
} from '@throwl/shared-domain-models';
import { PlayerItem } from './components/PlayerItem/PlayerItem';
import { useAppTheme } from '@throwl/shared-theme';
import { GameService } from '@throwl/shared-data-access-game';
import { useStyles } from './PlayerSelect.styles';
import { useNewGame } from '../../../feature/NewGameContext';
import { reconcileTeams, shuffled } from '../../../feature/team-arrangement';
import { useStartGame } from '../../../feature/useStartGame';
import { GameFlowStackNames, StepperParamList } from '../NewGame';
import { NewGameScreenLayout } from '../NewGameScreenLayout';

export const PlayerSelectScreen = () => {
  const { width } = useWindowDimensions();
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const stepper = useNavigation<NativeStackNavigationProp<StepperParamList>>();
  const { state, setState } = useNewGame();
  const start = useStartGame();
  const { user } = useAuthContext();
  const { players: selectedUsers, guests: guestUsers } = state;
  const isTeamGame = state.format === 'teams';
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState<string>('');
  const { colors } = useAppTheme();
  const setSelectedUsers = useCallback(
    (selectedUsers: string[] | ((current: string[]) => string[])) => {
      setState((current) => ({
        ...current,
        players: (Array.isArray(selectedUsers)
          ? selectedUsers
          : selectedUsers(current.players)
        ).slice(0, MAX_GAME_PLAYERS),
      }));
    },
    [setState],
  );
  const styles = useStyles();

  const addGuest = useCallback(() => {
    if (validGuestName(guestName)) {
      setState((current) => ({
        ...current,
        guests: [...current.guests, guestName],
      }));
      setGuestName('');
      setAddGuestOpen(false);
    }
  }, [setState, guestName]);

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
  const hasTeamCount = teamCounts(selectedIds.length).length > 0;
  const validTeamPlayers =
    selectedIds.length === selectedUsers.length &&
    new Set(selectedIds).size === selectedIds.length &&
    selectedIds.every(
      (id) =>
        players.filter((player) => gamePlayerId(player) === id).length === 1,
    );
  const invalidGuest = selectedPlayers.find(
    (player) => player.type === 'guest_user' && !validGuestName(player.name),
  );
  const canContinue =
    selectedPlayers.length > 0 &&
    !invalidGuest &&
    (!isTeamGame || (hasTeamCount && validTeamPlayers));
  const startGameButton = (
    <LogoButton
      label={isTeamGame ? 'Next' : 'GO'}
      size={Math.max(50, width * 0.1)}
      disabled={!canContinue}
      onPress={() => {
        if (!canContinue) return;
        const lineup = selectedPlayers.map(serializePlayerParam);
        if (!isTeamGame) {
          start(lineup);
          return;
        }
        setState((current) => ({
          ...current,
          teams: reconcileTeams(selectedIds, current.teams),
        }));
        stepper.push(GameFlowStackNames.TEAM_ARRANGEMENT, { players: lineup });
      }}
    />
  );

  return (
    <>
      <NewGameScreenLayout action={startGameButton} scrollable={false}>
        <AppHeader
          title="The Players"
          right={
            !isTeamGame ? (
              <IconButton
                accessibilityLabel="Randomize players"
                icon="shuffle-variant"
                iconColor={colors.onBackground}
                disabled={selectedUsers.length < 2}
                onPress={() => setSelectedUsers(shuffled(selectedUsers))}
              />
            ) : undefined
          }
        />
        <View style={styles.actions}>
          <Button
            icon="account-plus-outline"
            textColor={colors.onBackground}
            onPress={() => setAddGuestOpen(true)}
          >
            Add guest
          </Button>
          {(selectedUsers.length > 0 || guestUsers.length > 0) && (
            <Button
              textColor={colors.secondary}
              onPress={() => {
                setState((current) => ({
                  ...current,
                  players: [],
                  guests: [],
                  teams: undefined,
                }));
              }}
            >
              Clear
            </Button>
          )}
        </View>
        {selectedUsers.length === MAX_GAME_PLAYERS && (
          <Text style={styles.validation}>
            Player limit reached ({MAX_GAME_PLAYERS}).
          </Text>
        )}
        {invalidGuest && (
          <Text>Guest names must be between 1 and 80 characters.</Text>
        )}
        {isTeamGame && (
          <Text style={styles.validation}>
            {selectedIds.length} selected. Choose 4, 6 or 8 players for equal
            teams.
          </Text>
        )}
        {isTeamGame && hasTeamCount && !validTeamPlayers && (
          <Text style={styles.validation}>
            Choose players with distinct names or accounts.
          </Text>
        )}
        <View style={styles.playerList}>
          <FlatList<Omit<User, 'friends'> | GuestUser>
            data={players}
            keyExtractor={(player) => GameService.stubPlayer(player).id}
            ListEmptyComponent={
              <Text style={styles.header}>
                You have not added any friends yet, you can also add a guest
                using Add guest above
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
        contentPaddingHorizontal={24}
        subTitle="Guest names must be between 1 and 80 characters."
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
