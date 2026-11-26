import { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
  useNavigation,
  usePreventRemove,
  useRoute,
} from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  DOUBLES_GAME_DETAIL_SCREEN,
  DOUBLES_GAME_SCREEN,
  HOME_SCREEN,
  PLAYED_GAMES_SCREEN,
  RootStackParamList,
  deserializeGameParam,
  serializeGameParam,
} from '@throwl/shared-constants';
import { RouteProp } from '@react-navigation/native';
import { Alert, Dimensions, FlatList, Pressable, View } from 'react-native';
import { DartboardScoreType, Turn } from '@throwl/shared-domain-models';
import { Text } from 'react-native-paper';
import {
  ClickableDartboard,
  AppbarBackAction,
  TurnIndicatorBar,
  WinnerModal,
} from '@throwl/shared-ui';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  GameHelper,
  resolveParticipants,
  ScoringParticipant,
} from '@throwl/shared-domain-game-rules';
import Confetti from 'react-native-confetti';
import { FullScreenLayout } from '@throwl/shared-layouts';
import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';

import { useStyles } from './styles';
import { DropOutModel } from '@throwl/shared-ui';
import { useSpeak } from '@throwl/shared-hooks';
import { useAppTheme } from '@throwl/shared-theme';
import { ScoreTable } from './ScoreTable/ScoreTable';
import { GameService, useTeamGameSave } from '@throwl/shared-data-access-game';
import { useDoublesGameController } from '../../../feature/useDoublesGameController';

export const DoublesGameScreen: FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, typeof DOUBLES_GAME_SCREEN>>();
  const speak = useSpeak({ language: 'en-US', rate: 0.45 });

  const gameOptions = route.params.options;
  const activeGame = useMemo(
    () =>
      route.params.activeGame
        ? deserializeGameParam(route.params.activeGame)
        : undefined,
    [route.params.activeGame],
  );

  const teams = activeGame?.teams ?? route.params.teams;
  const [players, setPlayers] = useState(() =>
    route.params.players.map(GameService.stubPlayer),
  );
  const [gameId, setGameId] = useState<string | undefined>(activeGame?.id);

  const { colors } = useAppTheme();
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const iconSize = Math.max(width * 0.04, 24);

  const scoreTableRef = useRef<FlatList<ScoringParticipant>>(null);
  const confettiRef = useRef<Confetti>(null);

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
      options: {
        mode: 'doubles',
        endOnInvalid: gameOptions.endOnInvalid,
        quickMatch: gameOptions.quickMatch,
        skipBull: gameOptions.skipBull,
      },
      finished,
    });
  };

  const controller = useDoublesGameController({
    players,
    teams,
    setPlayers,
    options: gameOptions,
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
        'Wait for the last visit to save before leaving.',
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
          onPress={() =>
            controller.onThrow({
              type: DartboardScoreType.Out,
              score: 0,
            })
          }
        >
          <View style={styles.dartboardWrapper}>
            <Text style={styles.missText}>MISS</Text>
            <ClickableDartboard onClick={controller.onThrow} />
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
            scoreTableRef={scoreTableRef}
            players={players}
            teams={teams}
            gameOptions={gameOptions}
            turns={controller.turns}
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
                name: DOUBLES_GAME_DETAIL_SCREEN,
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
