import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/core';
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
import { Dimensions, FlatList, Pressable, View } from 'react-native';
import { DartboardScoreType, Turn } from '@throwl/shared-domain-models';
import { Appbar, Text } from 'react-native-paper';
import {
  ClickableDartboard,
  TurnIndicatorBar,
  WinnerModal,
} from '@throwl/shared-ui';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GameHelper } from '@throwl/shared-domain-game-rules';
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
import { GameService } from '@throwl/shared-data-access-game';
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

  const [players, setPlayers] = useState(() =>
    route.params.players.map(GameService.stubPlayer),
  );
  const [gameId, setGameId] = useState<string | undefined>(activeGame?.id);

  const { colors } = useAppTheme();
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const iconSize = Math.max(width * 0.04, 24);

  const scoreTableRef = useRef<FlatList>(null);
  const confettiRef = useRef<Confetti>(null);

  const persistGame = async (turnsToPersist: Turn[], finished: boolean) => {
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

          <ScoreTable
            scoreTableRef={scoreTableRef}
            players={players}
            gameOptions={gameOptions}
            turns={controller.turns}
            activeUserIndex={controller.activePlayerIndex}
            currentTurn={controller.currentTurn}
            width={width}
            setDroppingOutUserIndex={controller.setDropoutPlayerIndex}
          />
        </SafeAreaView>
      </View>

      <Confetti timeout={5} size={2} ref={confettiRef} untilStopped />

      <WinnerModal
        winnerName={players[controller.activePlayerIndex]?.name ?? ''}
        onStatsPress={async () => {
          if (!gameId) return;
          controller.setIsWinnerModalVisible(false);
          navigation.reset({
            index: 0,
            routes: [
              { name: HOME_SCREEN },
              { name: PLAYED_GAMES_SCREEN },
              {
                name: DOUBLES_GAME_DETAIL_SCREEN,
                params: {
                  game: serializeGameParam(await GameService.getById(gameId)),
                },
              },
            ],
          });
        }}
        onUndoPress={controller.undoThrow}
        onExitPress={() => {
          controller.setIsWinnerModalVisible(false);
          navigation.popToTop();
        }}
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
        <Appbar.BackAction color={colors.primary} onPress={navigation.goBack} />
      </View>
    </FullScreenLayout>
  );
};
