import {
  NEW_GAME_SCREEN,
  NORMAL_GAME_DETAIL_SCREEN,
  RootStackParamList,
  deserializeGameParam,
} from '@throwl/shared-constants';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FC, useMemo, useState } from 'react';
import { Dimensions, FlatList, Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  Accordion,
  AppbarBackAction,
  ClickableDartboard,
} from '@throwl/shared-ui';
import { useAppTheme } from '@throwl/shared-theme';
import { FullScreenLayout } from '@throwl/shared-layouts';
import {
  GameHelper,
  resolveParticipants,
  participantVisits,
  getGameWinner,
} from '@throwl/shared-domain-game-rules';
import { GuestUser, User, X01Options } from '@throwl/shared-domain-models';
import { GraphContainer } from './components/GraphContainer/GraphContainer';
import { StatsContainer } from './components/StatsContainer/StatsContainer';
import { useStyles } from './styles';
import { GameService } from '@throwl/shared-data-access-game';

export const NormalGameDetailScreen: FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [heatmap, setHeatmap] = useState<Map<string, number>>();

  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, typeof NORMAL_GAME_DETAIL_SCREEN>>();
  const game = useMemo(
    () => deserializeGameParam(route.params.game),
    [route.params.game],
  );
  const gameOptions = game.options as X01Options;

  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const lineup = resolveParticipants(
    game.players.map(GameService.stubPlayer),
    game.teams,
  );
  const result = getGameWinner(game);
  const finishingVisit = result?.visit;

  const textSize = Math.max(Dimensions.get('window').width * 0.04, 20);
  const styles = useStyles(textSize);

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <View style={styles.dartboardWrapper}>
          <Pressable
            onPress={() =>
              navigator.push(NEW_GAME_SCREEN, {
                selectedUsers: game.players.map((u) =>
                  u.type === 'user' ? u.id : u.name,
                ),
                guestUsers: game.players
                  .filter((u) => u.type === 'guest_user')
                  .map((u) => u.name),
                gameOptions: game.options,
                ...(game.teams ? { teams: game.teams } : {}),
              })
            }
          >
            <View style={styles.dartboard}>
              <ClickableDartboard heatmap={heatmap} />
            </View>
            <Text style={styles.missText}>REMATCH?</Text>
          </Pressable>
        </View>
        <SafeAreaView style={styles.playerListWrapper}>
          <FlatList<User | GuestUser>
            alwaysBounceVertical={false}
            data={game.players}
            ListHeaderComponent={
              game.teams ? (
                <View>
                  {!game.finished && <Text>Saved game · In progress</Text>}
                  {lineup.participants.map((side) => {
                    const visits = participantVisits(game.turns, side.members);
                    const count = visits.reduce(
                      (sum, visit) => sum + visit.throws.length,
                      0,
                    );
                    const names = side.members
                      .map(
                        (id) =>
                          game.players
                            .map(GameService.stubPlayer)
                            .find((player) => player.id === id)?.name,
                      )
                      .join(', ');
                    const progress =
                      gameOptions.startingScore -
                      GameHelper.calculateScore(visits, true);
                    const stats = GameHelper.getPostNormalGameTurnStats(
                      visits,
                      gameOptions.startingScore,
                    );
                    const summary = `${progress} remaining · ${stats.amount180} × 180`;
                    return (
                      <Accordion
                        key={side.id}
                        title={side.name}
                        subtitle={
                          side.id === result?.participant.id
                            ? 'Winner'
                            : summary
                        }
                        open={selectedUserId === `team:${side.id}`}
                        onChange={() =>
                          setSelectedUserId(
                            selectedUserId === `team:${side.id}`
                              ? undefined
                              : `team:${side.id}`,
                          )
                        }
                      >
                        <Text>{names}</Text>
                        <Text>{`${summary} · ${visits.length} visits · ${count} darts`}</Text>
                        <GraphContainer turns={visits} />
                      </Accordion>
                    );
                  })}
                </View>
              ) : undefined
            }
            style={styles.playerList}
            renderItem={({ item }) => {
              const parsedPlayer = GameService.stubPlayer(item);
              const userTurns = game.turns.filter(
                (t) => t.userId === parsedPlayer.id,
              );
              const side = lineup.participantFor(parsedPlayer.id);
              const teamVisits =
                game.teams && side
                  ? participantVisits(game.turns, side.members)
                  : undefined;
              const userThrows = userTurns
                .filter((turn) => turn.isValid)
                .flatMap((turn) => turn.throws)
                .filter((thrw) => thrw.score !== 0);
              const throwCount = GameHelper.getThrowCounts(userThrows);
              const userScore =
                GameHelper.calculateInNormalGameScoreStatsForUser(
                  userTurns,
                  gameOptions.startingScore,
                );
              const turnStats = GameHelper.getPostNormalGameTurnStats(
                teamVisits ?? userTurns,
                gameOptions.startingScore,
                teamVisits ? parsedPlayer.id : undefined,
              );
              const throwStats =
                GameHelper.getPostNormalGameThrowStats(userTurns);
              const lastThrown = userTurns.at(-1)?.throws.at(-1);
              const finishedForTeam =
                game.teams && finishingVisit?.userId === parsedPlayer.id;
              const checkout = finishedForTeam
                ? GameHelper.calculateTurnScore(finishingVisit)
                : undefined;

              return (
                <Accordion
                  title={parsedPlayer.name}
                  titleStyle={styles.playerName}
                  subtitle={
                    game.teams
                      ? checkout !== undefined
                        ? `Checkout: ${checkout}`
                        : side?.name
                      : finishingVisit?.userId === parsedPlayer.id
                        ? 'Winner'
                        : `Remaining score: ${userScore.score}`
                  }
                  subtitleStyle={styles.scoreText}
                  open={selectedUserId === parsedPlayer.id}
                  onChange={() => {
                    setSelectedUserId((current) => {
                      setHeatmap(
                        current === parsedPlayer.id
                          ? undefined
                          : GameHelper.calculateHeatmap(throwCount),
                      );
                      return current === parsedPlayer.id
                        ? undefined
                        : parsedPlayer.id;
                    });
                  }}
                >
                  <View style={styles.accordionContent}>
                    <View style={styles.statsContainer}>
                      <StatsContainer
                        textSize={textSize}
                        turnStats={turnStats}
                        throwStats={throwStats}
                        lastThrown={lastThrown}
                        mostThrown={throwCount[0]?.[1]}
                        userScore={
                          game.teams
                            ? finishedForTeam
                              ? 0
                              : -1
                            : finishingVisit?.userId === parsedPlayer.id
                              ? 0
                              : -1
                        }
                      />
                    </View>
                    <View style={styles.graphContainer}>
                      <GraphContainer turns={userTurns} />
                    </View>
                  </View>
                </Accordion>
              );
            }}
          />
        </SafeAreaView>
      </View>
      <View style={[styles.backButton, { top: insets.top }]}>
        <AppbarBackAction color={colors.primary} onPress={navigator.goBack} />
      </View>
    </FullScreenLayout>
  );
};
