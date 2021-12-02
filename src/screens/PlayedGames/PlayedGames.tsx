import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  LayoutAnimation,
  RefreshControl,
  View,
} from 'react-native';
import { GameService } from '~/services/game_service';
import { AuthContext } from '~/context/AuthContext';
import { Game } from '~/models/game';
import { Divider, Text, TouchableRipple } from 'react-native-paper';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { makeStyles } from './styles';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PLAY_GAME_SCREEN, RootStackParamList } from '#/navigation';
import { Swipeable } from '~/components/Swipeable/Swipeable';
import { UserService } from '~/services/user_service';

export const PlayedGamesScreen: React.FC<any> = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fetchingMore, setFetchingMore] = React.useState<boolean>(false);
  const [initialLoading, setInitialLoading] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [games, setGames] = React.useState<Game[]>([]);
  const { user } = React.useContext(AuthContext);
  const styles = makeStyles();

  React.useEffect(() => {
    if (user) {
      loadNewGames();
    }
  }, [user]);

  const loadNewGames = () => {
    if (loading) return;
    setLoading(true);
    GameService.getOwnGames(user!.id, 15).then(games => {
      setGames(games);
      setLoading(false);
      setInitialLoading(false);
    });
  };

  const loadMoreGames = () => {
    if (fetchingMore) return;
    setFetchingMore(true);
    GameService.getOwnGames(user!.id, 5, games[games.length - 1].id).then(
      games => {
        setGames(current => [
          ...current,
          ...games.filter(i => !current.some(g => i.id === g.id)),
        ]);
        setFetchingMore(false);
      }
    );
  };

  const goToGame = (game: Game) => () => {
    if (!game.finished) {
      navigator.push(PLAY_GAME_SCREEN, {
        startingScore: game.startingScore,
        players: game.players,
        activeGame: game,
      });
    } else {
      // navigator.push(GAME_DETAIL_SCREEN, { game });
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
        <Text style={styles.heading}>PLAYED GAMES</Text>
        <Divider style={styles.divider} />
        <FlatList
          style={styles.list}
          data={games}
          indicatorStyle="white"
          keyExtractor={item => item.id}
          onEndReachedThreshold={0.9}
          onEndReached={({ distanceFromEnd }) => {
            if (distanceFromEnd < 0) return;
            loadMoreGames();
          }}
          refreshControl={
            <RefreshControl
              size={0}
              tintColor="white"
              colors={['white']}
              refreshing={loading}
              onRefresh={loadNewGames}
            />
          }
          renderItem={({ item: game, index }) => {
            return (
              <Swipeable
                key={game.id}
                bounce={index === 0}
                rightActions={[
                  {
                    icon: 'delete',
                    onPress: async () => {
                      await GameService.delete(game.id);
                      setGames(prev => prev.filter(g => g.id !== game.id));
                      LayoutAnimation.configureNext(layoutAnimConfig);
                    },
                  },
                ]}>
                <TouchableRipple onPress={goToGame(game)}>
                  <View style={styles.listItem}>
                    {game.finished ? (
                      <Icon
                        style={styles.listItemIcon}
                        color="white"
                        name="check-bold"
                      />
                    ) : (
                      <Icon
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
              </Swipeable>
            );
          }}
          ListEmptyComponent={
            <View
              style={{
                paddingVertical: Dimensions.get('window').height * 0.025,
              }}>
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
                }}>
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : undefined
          }
        />
      </View>
    </FullScreenLayout>
  );
};
