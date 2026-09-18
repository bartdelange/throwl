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

  const goToGame = (game: Game) => () => {
    if (!game.finished) {
      if (game.options.mode === 'doubles') {
        navigator.push(DOUBLES_GAME_SCREEN, {
          options: game.options,
          players: game.players.map(serializePlayerParam),
          activeGame: serializeGameParam(game),
        });
      } else {
        navigator.push(NORMAL_GAME_SCREEN, {
          options: game.options,
          players: game.players.map(serializePlayerParam),
          activeGame: serializeGameParam(game),
        });
      }
    } else {
      if (game.options.mode === 'doubles') {
        navigator.push(DOUBLES_GAME_DETAIL_SCREEN, {
          game: serializeGameParam(game),
        });
      } else {
        navigator.push(NORMAL_GAME_DETAIL_SCREEN, {
          game: serializeGameParam(game),
        });
      }
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
                      </Text>
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
