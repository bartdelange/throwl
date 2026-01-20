import {
  HOME_SCREEN,
  NORMAL_GAME_DETAIL_SCREEN,
  NORMAL_GAME_SCREEN,
  PLAYED_GAMES_SCREEN,
  RootStackParamList,
  DartFinishers,
} from '@throwl/shared-constants';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FC, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, View } from 'react-native';
import Confetti from 'react-native-confetti';
import { Appbar, Text } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';

import { useAppTheme } from '../../../App/theming';
import { ClickableDartboard } from '../../../components/ClickableDartboard/ClickableDartboard';
import { FullScreenLayout } from '../../../layouts/FullScreen/FullScreen';
import { DartboardScoreType, Turn } from '@throwl/shared-domain-models';
import { TurnIndicatorBar } from '../../../components/TurnIndicatorBar/TurnIndicatorBar';
import { ScoreTable } from './components/ScoreTable/ScoreTable';
import { DropOutModel } from '../../../components/DropOutModel/DropOutModel';
import { WinnerModal } from '../../../components/WinnerModal/WinnerModal';
import { useSpeak } from '../../../hooks/useSpeak';
import { useStyles } from './styles';
import { GameService } from '../../../services/game_service';
import { useX01GameController } from '../../../hooks/useX01GameController';

export const NormalGameScreen: FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, typeof NORMAL_GAME_SCREEN>>();
  const speak = useSpeak({ language: 'en-US', rate: 0.45 });

  const activeGame = route.params.activeGame;
  const gameOptions = route.params.options;

  // Players must be “id resolved” here (so controller has stable ids)
  const [players, setPlayers] = useState(() =>
    route.params.players.map(GameService.stubPlayer),
  );

  const { colors } = useAppTheme();
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const iconSize = Math.max(width * 0.04, 24);

  const scoreTableRef = useRef<FlatList>(null);
  const confettiRef = useRef<Confetti>(null);

  const [gameId, setGameId] = useState<string | undefined>(activeGame?.id);

  const persistGame = async (turnsToPersist: Turn[], finished: boolean) => {
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

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <Pressable
          onPress={(evt) =>
            controller.onThrow(
              { type: DartboardScoreType.Out, score: 0 },
              { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY },
            )
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
          />

          <ScoreTable
            turns={controller.turns}
            activeUserIndex={controller.activePlayerIndex}
            scoreTableRef={scoreTableRef}
            players={players}
            startingScore={gameOptions.startingScore}
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
                name: NORMAL_GAME_DETAIL_SCREEN,
                params: { game: await GameService.getById(gameId) },
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
