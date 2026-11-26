import {
  DOUBLES_GAME_DETAIL_SCREEN,
  DOUBLES_GAME_SCREEN,
  NORMAL_GAME_DETAIL_SCREEN,
  NORMAL_GAME_SCREEN,
  RootStackParamList,
  serializeGameParam,
  serializePlayerParam,
} from '@throwl/shared-constants';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { FC, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  LayoutAnimation,
  RefreshControl,
  View,
} from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { SwipeActions, AppHeader } from '@throwl/shared-ui';
import { useAuthContext } from '@throwl/feature-auth';
import { FullScreenLayout } from '@throwl/shared-layouts';
import { getGameWinner } from '@throwl/shared-domain-game-rules';
import { Game } from '@throwl/shared-domain-models';
import { GameService } from '@throwl/shared-data-access-game';
import { useStyles } from './styles';

const PlayedGamesScreen: FC = () => {
  const [fetchingMore, setFetchingMore] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [games, setGames] = useState<Game[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { user } = useAuthContext();
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const styles = useStyles();

  const loadNewGames = useCallback(async () => {
    if (loading || !user) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      const games = await GameService.getPlayedGames(user.id, 15);
      setGames(games);
      setHasMore(games.length === 15);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [loading, user]);

  useEffect(() => {
    if (user && initialLoading) {
      loadNewGames();
    }
  }, [initialLoading, loadNewGames, user]);

  const loadMoreGames = async () => {
    if (!games.length) return;
    if (!user) return;
    if (loading) return;
    if (fetchingMore) return;
    setFetchingMore(true);
    setLoadFailed(false);
    try {
      const nextGames = await GameService.getPlayedGames(
        user.id,
        5,
        games[games.length - 1].id,
      );
      setGames((current) => [
        ...current,
        ...nextGames.filter(
          (game: Game) => !current.some((g) => game.id === g.id),
        ),
      ]);
      setHasMore(nextGames.length === 5);
    } catch {
      setLoadFailed(true);
    } finally {
      setFetchingMore(false);
    }
  };

  const goToGame = (game: Game) => async () => {
    let activeGame: Game;
    try {
      activeGame = await GameService.getById(game.id);
    } catch (error) {
      const code =
        error instanceof Error && 'code' in error ? error.code : undefined;
      const unavailable =
        code === 'firestore/permission-denied' ||
        code === 'permission-denied' ||
        code === 'firestore/not-found' ||
        code === 'not-found';
      if (unavailable)
        setGames((current) => current.filter(({ id }) => id !== game.id));
      Alert.alert(
        unavailable ? 'Game unavailable' : 'Could not open game',
        unavailable
          ? 'This game was deleted or you no longer have access.'
          : 'Please check your connection and try again.',
      );
      return;
    }

    setGames((current) =>
      current.map((item) => (item.id === activeGame.id ? activeGame : item)),
    );
    const canScore = Boolean(
      user &&
        (activeGame.createdBy === user.id ||
          activeGame.playerIds?.includes(user.id)),
    );
    if (activeGame.finished || !canScore) {
      navigator.push(
        activeGame.options.mode === 'doubles'
          ? DOUBLES_GAME_DETAIL_SCREEN
          : NORMAL_GAME_DETAIL_SCREEN,
        { game: serializeGameParam(activeGame) },
      );
      return;
    }

    const players = activeGame.players.map(serializePlayerParam);
    if (activeGame.options.mode === 'doubles') {
      navigator.push(DOUBLES_GAME_SCREEN, {
        options: activeGame.options,
        players,
        activeGame: serializeGameParam(activeGame),
      });
    } else {
      navigator.push(NORMAL_GAME_SCREEN, {
        options: activeGame.options,
        players,
        activeGame: serializeGameParam(activeGame),
      });
    }
  };

  const layoutAnimConfig = {
    duration: 300,
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      duration: 300,
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  };

  return (
    <FullScreenLayout size="fullscreen" style={styles.layout}>
      <View style={styles.content}>
        <AppHeader title="PLAYED GAMES" />
        <FlatList
          style={styles.list}
          data={games}
          indicatorStyle="white"
          keyExtractor={(item) => item.id}
          onEndReachedThreshold={0.9}
          onEndReached={({ distanceFromEnd }) => {
            if (distanceFromEnd < 0 || !hasMore) return;
            loadMoreGames();
          }}
          refreshControl={
            <RefreshControl
              tintColor="white"
              refreshing={!initialLoading && loading}
              onRefresh={loadNewGames}
            />
          }
          renderItem={({ item: game, index }) => {
            const winner = game.teams
              ? getGameWinner(game)?.participant.name
              : undefined;
            return (
              <SwipeActions
                key={game.id}
                bounce={index === 0}
                rightActions={[
                  {
                    icon: 'delete',
                    onPress: async () => {
                      if (!user) return;
                      await GameService.removeFromHistory(game.id, user.id);
                      setGames((prev) => prev.filter((g) => g.id !== game.id));
                      LayoutAnimation.configureNext(layoutAnimConfig);
                    },
                  },
                ]}
              >
                <TouchableRipple onPress={goToGame(game)}>
                  <View style={styles.listItem}>
                    {game.finished ? (
                      <MaterialDesignIcons
                        style={styles.listItemIcon}
                        color="white"
                        name="check-bold"
                      />
                    ) : (
                      <MaterialDesignIcons
                        style={styles.listItemIcon}
                        color="white"
                        name="pause"
                      />
                    )}
                    <View>
                      <Text style={styles.listItemGameState}>
                        {game.finished ? 'Finished game' : 'Unfinished game'}
                        {game.teams &&
                          ` · ${game.options.mode === 'x01' ? 'x01' : 'Doubles'} ${game.teams.map(({ members }) => members.length).join('v')}`}
                      </Text>
                      {winner && (
                        <Text
                          style={styles.listItemGameState}
                        >{`${winner} won`}</Text>
                      )}
                      <Text style={styles.listItemGameTimes}>
                        Started at{' '}
                        {format(game.started, 'LLL dd, yyyy - HH:mm')}
                      </Text>
                    </View>
                  </View>
                </TouchableRipple>
              </SwipeActions>
            );
          }}
          ListEmptyComponent={
            <View
              style={{
                paddingVertical: Dimensions.get('window').height * 0.025,
              }}
            >
              {initialLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : loadFailed ? (
                <Text style={styles.heading}>
                  Could not load played games. Pull to retry.
                </Text>
              ) : (
                <Text style={styles.heading}>No games found</Text>
              )}
            </View>
          }
          ListFooterComponent={
            fetchingMore ? (
              <View
                style={{
                  paddingVertical: Dimensions.get('window').height * 0.025,
                }}
              >
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : undefined
          }
        />
      </View>
    </FullScreenLayout>
  );
};
export default PlayedGamesScreen;
