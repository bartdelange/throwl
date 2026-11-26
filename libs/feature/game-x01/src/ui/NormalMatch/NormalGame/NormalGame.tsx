import {
  DartFinishers,
  HOME_SCREEN,
  NORMAL_GAME_DETAIL_SCREEN,
  NORMAL_GAME_SCREEN,
  PLAYED_GAMES_SCREEN,
  RootStackParamList,
  deserializeGameParam,
  serializeGameParam,
} from '@throwl/shared-constants';
import {
  useNavigation,
  usePreventRemove,
  useRoute,
} from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Pressable, View } from 'react-native';
import Confetti from 'react-native-confetti';
import { Text } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';

import { useAppTheme } from '@throwl/shared-theme';
import {
  ClickableDartboard,
  AppbarBackAction,
  TurnIndicatorBar,
  WinnerModal,
} from '@throwl/shared-ui';
import { FullScreenLayout } from '@throwl/shared-layouts';
import { DartboardScoreType, Turn } from '@throwl/shared-domain-models';
import { ScoreTable } from './components/ScoreTable/ScoreTable';
import { DropOutModel } from '@throwl/shared-ui';
import { useSpeak } from '@throwl/shared-hooks';
import { useStyles } from './styles';
import { GameService, useTeamGameSave } from '@throwl/shared-data-access-game';
import { useX01GameController } from '../../../feature/useX01GameController';
import {
  GameHelper,
  resolveParticipants,
  ScoringParticipant,
} from '@throwl/shared-domain-game-rules';

export const NormalGameScreen: FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, typeof NORMAL_GAME_SCREEN>>();
  const speak = useSpeak({ language: 'en-US', rate: 0.45 });

  const activeGame = useMemo(
    () =>
      route.params.activeGame
        ? deserializeGameParam(route.params.activeGame)
        : undefined,
    [route.params.activeGame],
  );
  const gameOptions = route.params.options;
  const teams = activeGame?.teams ?? route.params.teams;

  // Players must be “id resolved” here (so controller has stable ids)
  const [players, setPlayers] = useState(() =>
    route.params.players.map(GameService.stubPlayer),
  );

  const { colors } = useAppTheme();
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const iconSize = Math.max(width * 0.04, 24);

  const scoreTableRef = useRef<FlatList<ScoringParticipant>>(null);
  const confettiRef = useRef<Confetti>(null);

  const [gameId, setGameId] = useState<string | undefined>(activeGame?.id);

  const teamSave = useTeamGameSave(
    activeGame,
    teams,
    route.params.players,
    gameOptions,
  );
  const persistGame = async (turnsToPersist: Turn[], finished: boolean) => {
    if (teams) {
      await teamSave.save(turnsToPersist, finished);
      return;
    }
    await GameService.persistGame({
      gameId,
      setGameId,
      players,
      turns: turnsToPersist,
      options: { mode: 'x01', startingScore: gameOptions.startingScore },
      finished,
    });
  };

  const controller = useX01GameController({
    players,
    teams,
    setPlayers,
    startingScore: gameOptions.startingScore,
    finishers: DartFinishers,
    activeGame,
    scoreTableRef,
    speak,
    persistGame,
  });

  // Wake lock
  useEffect(() => {
    activateKeepAwake();
    return () => deactivateKeepAwake();
  }, []);

  // Keep players in sync with route params (if you still use navigation params changes)
  useEffect(() => {
    setPlayers(route.params.players.map(GameService.stubPlayer));
  }, [route.params.players]);

  // Confetti
  useEffect(() => {
    if (controller.isConfettiing) confettiRef.current?.startConfetti();
    else confettiRef.current?.stopConfetti();
  }, [controller.isConfettiing]);

  const lineup = useMemo(
    () => resolveParticipants(players, teams),
    [players, teams],
  );
  const activeTeam = lineup.participantFor(controller.currentTurn.userId);
  const activeThrower = players.find(
    ({ id }) => id === controller.currentTurn.userId,
  );
  const nextId = lineup.nextThrower(controller.currentTurn.userId);
  const nextThrower = players.find(({ id }) => id === nextId);
  const resultGameId = teams ? teamSave.id : gameId;

  usePreventRemove(Boolean(teams && teamSave.status !== 'idle'), ({ data }) => {
    if (teamSave.status === 'saving') {
      Alert.alert(
        'Saving game',
        'The last visit is still saving. Leaving now may lose unsaved changes.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave while saving',
            style: 'destructive',
            onPress: () => navigation.dispatch(data.action),
          },
        ],
      );
      return;
    }
    Alert.alert(
      'Unsaved game changes',
      teamSave.status === 'conflict'
        ? 'A newer game was saved elsewhere. Leave and reopen it from Played Games.'
        : 'You can stay and retry the save.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Discard unsaved changes',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });
  const saveFeedback =
    teamSave.status === 'failed' ? (
      <Pressable
        accessibilityRole="button"
        onPress={() => void teamSave.retry()}
      >
        <Text>Game save failed. Tap to retry.</Text>
      </Pressable>
    ) : teamSave.status === 'conflict' ? (
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
        <Text>
          A newer game was saved elsewhere. Reopen it from Played Games.
        </Text>
      </Pressable>
    ) : teamSave.status === 'saving' ? (
      <Text>Saving game…</Text>
    ) : null;

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <Pressable
          disabled={teamSave.status === 'conflict'}
          onPress={(evt) =>
            controller.onThrow(
              { type: DartboardScoreType.Out, score: 0 },
              { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY },
            )
          }
        >
          <View style={styles.dartboardWrapper}>
            <Text style={styles.missText}>MISS</Text>
            <ClickableDartboard
              onClick={
                teamSave.status === 'conflict' ? undefined : controller.onThrow
              }
            />
          </View>
        </Pressable>

        <SafeAreaView style={styles.scoreWrapper}>
          <TurnIndicatorBar
            currentTurn={controller.currentTurn}
            turnNeeded={controller.turnNeeded}
            iconSize={iconSize}
            undoThrow={controller.undoThrow}
            createScoreString={GameHelper.createScoreString}
          />

          {teams && !controller.isGameFinished && (
            <Text>{`${activeTeam?.name ?? ''} · Throwing: ${activeThrower?.name ?? ''} · Next: ${nextThrower?.name ?? ''}`}</Text>
          )}
          {!controller.isWinnerModalVisible && saveFeedback}
          <ScoreTable
            turns={controller.turns}
            scoreTableRef={scoreTableRef}
            players={players}
            teams={teams}
            activeUserIndex={controller.activePlayerIndex}
            startingScore={gameOptions.startingScore}
            currentTurn={controller.currentTurn}
            width={width}
            setDroppingOutUserIndex={controller.setDropoutPlayerIndex}
          />
        </SafeAreaView>
      </View>

      <Confetti timeout={5} size={2} ref={confettiRef} untilStopped />

      <WinnerModal
        saveFeedback={saveFeedback}
        statsDisabled={Boolean(teams && teamSave.status !== 'idle')}
        winnerName={
          teams && activeTeam
            ? `${activeTeam.name}: ${players
                .filter(({ id }) => activeTeam.members.includes(id))
                .map(({ name }) => name)
                .join(', ')}`
            : (players[controller.activePlayerIndex]?.name ?? '')
        }
        onStatsPress={async () => {
          if (!resultGameId || (teams && teamSave.status !== 'idle')) return;
          controller.setIsWinnerModalVisible(false);
          navigation.reset({
            index: 0,
            routes: [
              { name: HOME_SCREEN },
              { name: PLAYED_GAMES_SCREEN },
              {
                name: NORMAL_GAME_DETAIL_SCREEN,
                params: {
                  game: serializeGameParam(
                    await GameService.getById(resultGameId),
                  ),
                },
              },
            ],
          });
        }}
        onUndoPress={controller.undoThrow}
        onExitPress={() => navigation.popToTop()}
        visible={controller.isWinnerModalVisible}
      />

      <DropOutModel
        visible={controller.dropoutPlayerIndex != null}
        playerName={
          controller.dropoutPlayerIndex != null
            ? (players[controller.dropoutPlayerIndex]?.name.split(' ')[0] ??
              ' ')
            : ' '
        }
        dropOutUser={() => {
          if (controller.dropoutPlayerIndex == null) return null;
          return controller.dropOutUser(
            players[controller.dropoutPlayerIndex].id,
          );
        }}
        cancel={() => controller.setDropoutPlayerIndex(undefined)}
      />

      <View style={[styles.backButton, { top: insets.top }]}>
        <AppbarBackAction color={colors.primary} onPress={navigation.goBack} />
      </View>
    </FullScreenLayout>
  );
};
