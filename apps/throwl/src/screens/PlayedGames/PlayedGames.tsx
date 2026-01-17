import {
  DOUBLES_GAME_DETAIL_SCREEN,
  DOUBLES_GAME_SCREEN,
  NORMAL_GAME_DETAIL_SCREEN,
  NORMAL_GAME_SCREEN,
  RootStackParamList,
} from '../../constants/navigation';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import React, { FC, useCallback, useEffect, useState } from 'react';
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
import { SwipeActions } from '../../components/Swipeable/SwipeActions';
import { useAuthContext } from '../../context/AuthContext';
import { FullScreenLayout } from '../../layouts/FullScreen/FullScreen';
import { Game } from '@throwl/shared-domain-models';
import { GameService } from '../../services/game_service';
import { useStyles } from './styles';
import { AppHeader } from '../../components/AppHeader/AppHeader';

const PlayedGamesScreen: FC = () => {
  const [fetchingMore, setFetchingMore] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [games, setGames] = useState<Game[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { user } = useAuthContext();
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const styles = useStyles();

  const loadNewGames = useCallback(() => {
    if (loading || !user) return;
    setLoading(true);
    GameService.getOwnGames(user.id, 15).then((games) => {
      setGames(games);
      setLoading(false);
      setHasMore(games.length === 15);
      setInitialLoading(false);
    });
  }, [loading, user]);

  useEffect(() => {
    if (user && initialLoading) {
      loadNewGames();
    }
  }, [initialLoading, loadNewGames, user]);

  const loadMoreGames = () => {
    if (!games.length) return;
    if (!user) return;
    if (loading) return;
    if (fetchingMore) return;
    setFetchingMore(true);
    GameService.getOwnGames(user.id, 5, games[games.length - 1].id).then(
      (games) => {
        setGames((current) => [
          ...current,
          ...games.filter(
            (game: Game) => !current.some((g) => game.id === g.id),
          ),
        ]);
        setHasMore(games.length === 5);
        setFetchingMore(false);
      },
    );
  };

  const goToGame = (game: Game) => () => {
    if (!game.finished) {
      if (game.options.mode === 'doubles') {
        navigator.push(DOUBLES_GAME_SCREEN, {
          options: game.options,
          players: game.players,
          activeGame: game,
        });
      } else {
        navigator.push(NORMAL_GAME_SCREEN, {
          options: game.options,
          players: game.players,
          activeGame: game,
        });
      }
    } else {
      if (game.options.mode === 'doubles') {
        navigator.push(DOUBLES_GAME_DETAIL_SCREEN, {
          game,
        });
      } else {
        navigator.push(NORMAL_GAME_DETAIL_SCREEN, {
          game,
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
                      await GameService.delete(game.id);
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
