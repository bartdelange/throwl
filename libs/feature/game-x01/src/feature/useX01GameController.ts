import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlatList } from 'react-native';
import { Throw, Turn, TeamRoster } from '@throwl/shared-domain-models';
import {
  GameHelper,
  TurnNeeded,
  ScoringParticipant,
  resolveParticipants,
  participantVisits,
} from '@throwl/shared-domain-game-rules';
import { X01GameHelper } from '@throwl/shared-domain-game-rules';
import { IDartFinishers } from '@throwl/shared-constants';

type PlayerBase = { id: string; name: string };

export function useX01GameController<TPlayer extends PlayerBase>(args: {
  players: TPlayer[];
  teams?: TeamRoster;
  setPlayers: Dispatch<SetStateAction<TPlayer[]>>;

  startingScore: number;
  finishers: IDartFinishers;
  activeGame?: { id: string; turns: Turn[] } | undefined;

  scoreTableRef: RefObject<FlatList<ScoringParticipant> | null>;

  speak?: (text: string) => Promise<void> | void;
  persistGame: (turns: Turn[], finished: boolean) => Promise<void> | void;
}): {
  turns: Turn[];
  currentTurn: Turn;
  activePlayerIndex: number;

  isGameFinished: boolean;
  isWinnerModalVisible: boolean;
  isConfettiing: boolean;

  dropoutPlayerIndex: number | undefined;
  setDropoutPlayerIndex: (idx: number | undefined) => void;

  turnNeeded: TurnNeeded;

  onThrow: (thrw: Throw, pos?: { x: number; y: number }) => void;
  undoThrow: () => void;
  dropOutUser: (userId: string) => void;

  setIsWinnerModalVisible: (v: boolean) => void;
  setIsConfettiing: (v: boolean) => void;
} {
  const {
    players,
    teams,
    setPlayers,
    startingScore,
    finishers,
    activeGame,
    scoreTableRef,
    speak,
    persistGame,
  } = args;

  const lineup = useMemo(
    () => resolveParticipants(players, teams),
    [players, teams],
  );
  const indexFor = useCallback(
    (id: string) => players.findIndex((player) => player.id === id),
    [players],
  );
  const initialIndex = Math.max(0, indexFor(lineup.order[0]));
  const [turns, setTurns] = useState<Turn[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(initialIndex);

  const [currentTurn, setCurrentTurn] = useState<Turn>(() => ({
    userId: lineup.order[0] ?? '',
    throws: [],
  }));

  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isWinnerModalVisible, setIsWinnerModalVisible] = useState(false);
  const [isConfettiing, setIsConfettiing] = useState(false);

  const [dropoutPlayerIndex, setDropoutPlayerIndex] = useState<number>();

  const scrollToPlayer = useCallback(
    (index: number) => {
      const player = players[index];
      const row = teams
        ? lineup.participants.findIndex(({ members }) =>
            members.includes(player?.id),
          )
        : index;
      if (row < 0) return;
      scoreTableRef.current?.scrollToIndex({
        animated: true,
        viewPosition: 0.5,
        index: row,
      });
    },
    [scoreTableRef, players, teams, lineup],
  );

  const rotatePlayers = useCallback(() => {
    const nextIndex = indexFor(
      lineup.nextThrower(players[activePlayerIndex]?.id),
    );
    scrollToPlayer(nextIndex);
    setActivePlayerIndex(nextIndex);
    return nextIndex;
  }, [activePlayerIndex, indexFor, lineup, players, scrollToPlayer]);

  const turnNeeded = useMemo<TurnNeeded>(() => {
    return X01GameHelper.calculateTurnNeeded({
      turns,
      currentTurn,
      startingScore,
      finishers,
      scoringMembers: lineup.participantFor(currentTurn.userId)?.members,
    });
  }, [turns, currentTurn, startingScore, finishers, lineup]);

  const resumedGameId = useRef<string | undefined>(undefined);

  // Resume existing game
  useEffect(() => {
    if (!activeGame || resumedGameId.current === activeGame.id) return;
    resumedGameId.current = activeGame.id;

    setTurns(activeGame.turns);

    const lastTurn = activeGame.turns[activeGame.turns.length - 1];
    const nextId = lineup.nextThrower(lastTurn?.userId);
    setActivePlayerIndex(indexFor(nextId));
    scrollToPlayer(indexFor(nextId));

    setCurrentTurn({ userId: nextId ?? '', throws: [] });
  }, [activeGame, indexFor, lineup, scrollToPlayer]);

  const finishTurn = useCallback(
    async (turn: Turn, nextTurns: Turn[]) => {
      setTurns(nextTurns);

      const nextPlayerIndex = rotatePlayers();
      const nextPlayer = players[nextPlayerIndex];
      setCurrentTurn({ userId: nextPlayer.id, throws: [] });

      const remaining =
        startingScore -
        GameHelper.calculateScore(
          participantVisits(
            nextTurns,
            lineup.participantFor(nextPlayer.id)?.members ?? [nextPlayer.id],
          ),
          true,
        );
      if (remaining <= 170 && speak) {
        void speak(`${nextPlayer.name.split(' ')[0]} you need ${remaining}`);
      }

      await persistGame(nextTurns, false);
    },
    [players, rotatePlayers, startingScore, speak, persistGame, lineup],
  );

  const finishGame = useCallback(
    async (turn: Turn, nextTurns: Turn[]) => {
      setIsConfettiing(true);
      setIsGameFinished(true);
      setIsWinnerModalVisible(true);

      const winner = lineup.participantFor(turn.userId);
      if (winner && speak) {
        void speak(
          `${teams ? winner.name : winner.name.split(' ')[0]} has won!`,
        );
      }

      await persistGame(nextTurns, true);
    },
    [lineup, teams, speak, persistGame],
  );

  const onThrow = useCallback(
    (thrw: Throw) => {
      if (isGameFinished) return;

      const evalResult = X01GameHelper.evaluateThrow({
        turns,
        currentTurn,
        throw: thrw,
        startingScore,
        scoringMembers: lineup.participantFor(currentTurn.userId)?.members,
      });

      setCurrentTurn(evalResult.nextTurn);

      const nextTurns = [...turns, evalResult.nextTurn];

      if (evalResult.isWin) {
        void finishGame(evalResult.nextTurn, nextTurns);
        return;
      }

      if (!evalResult.shouldEndTurn) return;

      if (speak) {
        if (!evalResult.isValid) void speak('No score');
        else if (evalResult.turnScore === 69) void speak('sheeeeesh');
        else void speak(evalResult.turnScore.toFixed(0));
      }

      void finishTurn(evalResult.nextTurn, nextTurns);
    },
    [
      isGameFinished,
      turns,
      currentTurn,
      startingScore,
      speak,
      finishTurn,
      finishGame,
      lineup,
    ],
  );

  const undoThrow = useCallback(() => {
    setIsConfettiing(false);

    const {
      turns: nextTurns,
      currentTurn: nextTurn,
      didPopTurn,
    } = GameHelper.undoLastThrow({
      turns,
      currentTurn,
    });

    if (didPopTurn) {
      const index = indexFor(nextTurn.userId);
      setActivePlayerIndex(index);
      scrollToPlayer(index);
    }

    setTurns(nextTurns);
    const score =
      GameHelper.calculateScore(
        participantVisits(
          nextTurns,
          lineup.participantFor(nextTurn.userId)?.members ?? [nextTurn.userId],
        ),
        true,
      ) + GameHelper.calculateTurnScore(nextTurn);
    setCurrentTurn({
      ...nextTurn,
      isValid: X01GameHelper.checkThrowValidity(nextTurn, score, startingScore),
    });
    setIsWinnerModalVisible(false);
    setIsGameFinished(false);

    if (didPopTurn || isGameFinished) void persistGame(nextTurns, false);
  }, [
    turns,
    currentTurn,
    indexFor,
    scrollToPlayer,
    persistGame,
    isGameFinished,
    lineup,
    startingScore,
  ]);

  const dropOutUser = useCallback(
    (userId: string) => {
      if (teams || players.length <= 1) return;

      const leavingIndex = players.findIndex((p) => p.id === userId);
      if (leavingIndex < 0) return;
      const nextIndex =
        leavingIndex === activePlayerIndex
          ? leavingIndex % (players.length - 1)
          : activePlayerIndex - Number(leavingIndex < activePlayerIndex);

      const nextTurns = turns.filter((t) => t.userId !== userId);
      const nextPlayers = players.filter((p) => p.id !== userId);
      const nextPlayer = nextPlayers[nextIndex];

      setTurns(nextTurns);
      setPlayers(nextPlayers);

      setActivePlayerIndex(nextIndex);

      if (leavingIndex === activePlayerIndex) {
        setCurrentTurn({ userId: nextPlayer.id, throws: [] });
      }

      const remaining =
        startingScore -
        GameHelper.calculateUserValidScore(nextTurns, nextPlayer.id);
      if (remaining <= 170 && speak) {
        void speak(`${nextPlayer.name.split(' ')[0]} you need ${remaining}`);
      }

      setDropoutPlayerIndex(undefined);
      void persistGame(nextTurns, false);
    },
    [
      players,
      teams,
      turns,
      setPlayers,
      activePlayerIndex,
      startingScore,
      speak,
      persistGame,
    ],
  );

  return {
    turns,
    currentTurn,
    activePlayerIndex,

    isGameFinished,
    isWinnerModalVisible,
    isConfettiing,

    dropoutPlayerIndex,
    setDropoutPlayerIndex,

    turnNeeded,

    onThrow,
    undoThrow,
    dropOutUser,

    setIsWinnerModalVisible,
    setIsConfettiing,
  };
}
