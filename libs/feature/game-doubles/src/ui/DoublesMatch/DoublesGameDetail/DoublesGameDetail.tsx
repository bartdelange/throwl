import {
  DOUBLES_GAME_DETAIL_SCREEN,
  NEW_GAME_SCREEN,
  RootStackParamList,
  deserializeGameParam,
} from '@throwl/shared-constants';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ComponentProps, FC, useMemo, useState } from 'react';
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
import {
  DoublesOptions,
  GuestUser,
  Turn,
  User,
} from '@throwl/shared-domain-models';
import { GraphContainer } from './components/GraphContainer/GraphContainer';
import { StatsContainer } from './components/StatsContainer/StatsContainer';
import { useStyles } from './styles';
import { GameService } from '@throwl/shared-data-access-game';
import { DoublesGameHelper } from '@throwl/shared-domain-game-rules';

export const DoublesGameDetailScreen: FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [heatmap, setHeatmap] = useState<Map<string, number>>();

  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<
      RouteProp<RootStackParamList, typeof DOUBLES_GAME_DETAIL_SCREEN>
    >();
  const game = useMemo(
    () => deserializeGameParam(route.params.game),
    [route.params.game],
  );
  const gameOptions = game.options as DoublesOptions;

  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const players = game.players.map(GameService.stubPlayer);
  const lineup = resolveParticipants(players, game.teams);
  const result = getGameWinner(game);
  const finishingVisit = result?.visit;

  const textSize = Math.max(Dimensions.get('window').width * 0.04, 20);
  const styles = useStyles(textSize);

  function renderStats(
    stats: Omit<ComponentProps<typeof StatsContainer>, 'textSize'>,
    chartTurns?: Turn[],
    members?: string,
  ) {
    return (
      <View style={styles.accordionContent}>
        {members && <Text style={styles.members}>Team members: {members}</Text>}
        <View style={styles.statsContainer}>
          <StatsContainer
            textSize={textSize}
            teamGame={Boolean(game.teams)}
            {...stats}
          />
        </View>
        {chartTurns && (
          <View style={styles.graphContainer}>
            <GraphContainer turns={chartTurns} gameOptions={gameOptions} />
          </View>
        )}
      </View>
    );
  }

  function toggleResult(
    id: string,
    throwCount: ReturnType<typeof GameHelper.getThrowCounts>,
  ) {
    const next = selectedUserId === id ? undefined : id;
    setSelectedUserId(next);
    setHeatmap(next ? GameHelper.calculateHeatmap(throwCount) : undefined);
  }

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
                  <Text variant="titleMedium" style={styles.sectionHeading}>
                    Team Scores
                  </Text>
                  {lineup.participants.map((side) => {
                    const visits = participantVisits(game.turns, side.members);
                    const names = side.members
                      .map(
                        (id) =>
                          players.find((player) => player.id === id)?.name,
                      )
                      .join(', ');
                    const throws = visits.flatMap((visit) => visit.throws);
                    const won = side.id === result?.participant.id;
                    const winningThrow = won
                      ? finishingVisit?.throws.at(-1)
                      : undefined;
                    const cardId = `team:${side.id}`;
                    const throwCount = GameHelper.getThrowCounts(
                      throws.filter((dart) => dart.score !== 0),
                    );
                    const { next } = DoublesGameHelper.getNextDoubleNeeded(
                      visits,
                      side.members,
                      gameOptions,
                    );
                    const turnStats = GameHelper.getPostDoublesGameTurnStats(
                      visits,
                      gameOptions,
                    );
                    const summary =
                      won && winningThrow
                        ? `Winner · ${GameHelper.createScoreString(winningThrow)}`
                        : next
                          ? `Still needed: ${GameHelper.createScoreString(next)}`
                          : 'Ladder complete';
                    return (
                      <Accordion
                        key={side.id}
                        title={side.name}
                        titleStyle={styles.playerName}
                        subtitle={summary}
                        subtitleStyle={styles.scoreText}
                        open={selectedUserId === cardId}
                        onChange={() => toggleResult(cardId, throwCount)}
                      >
                        {renderStats(
                          { turnStats, winningThrow },
                          throws.length ? visits : undefined,
                          names,
                        )}
                      </Accordion>
                    );
                  })}
                  <Text variant="titleMedium" style={styles.sectionHeading}>
                    Individual Scores
                  </Text>
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
                .flatMap((turn) => turn.throws)
                .filter((thrw) => thrw.score !== 0);
              const throwCount = GameHelper.getThrowCounts(userThrows);
              const turnStats = GameHelper.getPostDoublesGameTurnStats(
                userTurns,
                gameOptions,
                teamVisits,
                teamVisits ? parsedPlayer.id : undefined,
              );
              const neededDouble = DoublesGameHelper.getNextDoubleNeeded(
                userTurns,
                parsedPlayer.id,
                gameOptions,
              );

              return (
                <Accordion
                  title={parsedPlayer.name}
                  titleStyle={styles.playerName}
                  subtitle={
                    game.teams
                      ? finishingVisit?.userId === parsedPlayer.id
                        ? `${side?.name} · Hit the final target`
                        : side?.name
                      : finishingVisit?.userId === parsedPlayer.id
                        ? 'Winner'
                        : `Still needed: ${neededDouble.next && GameHelper.createScoreString(neededDouble.next)}`
                  }
                  subtitleStyle={styles.scoreText}
                  open={selectedUserId === `player:${parsedPlayer.id}`}
                  onChange={() =>
                    toggleResult(`player:${parsedPlayer.id}`, throwCount)
                  }
                >
                  {renderStats(
                    {
                      turnStats,
                      winningThrow:
                        game.teams && finishingVisit?.userId === parsedPlayer.id
                          ? finishingVisit.throws.at(-1)
                          : undefined,
                    },
                    game.teams ? undefined : userTurns,
                  )}
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
