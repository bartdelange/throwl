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
import { Turn } from '~/models/turn.ts';
import { Throw } from '~/models/throw.ts';
import { GameHelper, TurnNeeded } from '~/lib/game_helper.ts';
import { X01GameHelper } from '~/lib/x01_game_helper.ts';
import { GuestUser, User } from '~/models/user.ts';

type PlayerBase = { id: string; name: string };

export function useX01GameController<TPlayer extends PlayerBase>(args: {
  players: TPlayer[];
  setPlayers: Dispatch<SetStateAction<TPlayer[]>>;

  startingScore: number;
  finishers: Record<number, Throw[] | undefined>;
  activeGame?: { id: string; turns: Turn[] } | undefined;

  scoreTableRef: RefObject<FlatList<User | GuestUser> | null>;

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
    setPlayers,
    startingScore,
    finishers,
    activeGame,
    scoreTableRef,
    speak,
    persistGame,
  } = args;

  const [turns, setTurns] = useState<Turn[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  const [currentTurn, setCurrentTurn] = useState<Turn>(() => ({
    userId: players[0]?.id ?? '',
    throws: [],
  }));

  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isWinnerModalVisible, setIsWinnerModalVisible] = useState(false);
  const [isConfettiing, setIsConfettiing] = useState(false);

  const [dropoutPlayerIndex, setDropoutPlayerIndex] = useState<number>();

  // Keep a ref for latest players length to avoid accidental stale closures in scroll logic
  const playersLengthRef = useRef(players.length);
  useEffect(() => {
    playersLengthRef.current = players.length;
  }, [players.length]);

  const scrollToPlayer = useCallback(
    (index: number) => {
      scoreTableRef.current?.scrollToIndex({
        animated: true,
        viewPosition: 0.5,
        index,
      });
    },
    [scoreTableRef],
  );

  const rotatePlayers = useCallback(
    (reverse: boolean = false, customIndex?: number) => {
      const nextIndex = GameHelper.getNextUserIndex({
        activeUserIndex: activePlayerIndex,
        playersLength: playersLengthRef.current,
        reverse,
        customIndex,
      });

      scrollToPlayer(nextIndex);
      setActivePlayerIndex(nextIndex);
      return nextIndex;
    },
    [activePlayerIndex, scrollToPlayer],
  );

  const turnNeeded = useMemo<TurnNeeded>(() => {
    return X01GameHelper.calculateTurnNeeded({
      turns,
      currentTurn,
      startingScore,
      finishers,
    });
  }, [turns, currentTurn, startingScore, finishers]);

  // Resume existing game
  useEffect(() => {
    if (!activeGame) return;

    setTurns(activeGame.turns);

    const lastTurn = activeGame.turns[activeGame.turns.length - 1];
    let nextIndex = 0;

    if (lastTurn) {
      const lastIndex = players.findIndex(p => p.id === lastTurn.userId);
      nextIndex = GameHelper.getNextUserIndex({
        activeUserIndex: lastIndex,
        playersLength: players.length,
      });
    }

    setActivePlayerIndex(nextIndex);
    scrollToPlayer(nextIndex);

    setCurrentTurn({ userId: players[nextIndex]?.id ?? '', throws: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGame?.id]); // intentionally keyed by game identity

  const finishTurn = useCallback(
    async (turn: Turn, nextTurns: Turn[]) => {
      setTurns(nextTurns);

      const nextPlayerIndex = rotatePlayers();
      const nextPlayer = players[nextPlayerIndex];
      setCurrentTurn({ userId: nextPlayer.id, throws: [] });

      const remaining =
        startingScore - GameHelper.calculateUserValidScore(nextTurns, nextPlayer.id);
      if (remaining <= 170 && speak) {
        await speak(`${nextPlayer.name.split(' ')[0]} you need ${remaining}`);
      }

      await persistGame(nextTurns, false);
    },
    [players, rotatePlayers, startingScore, speak, persistGame],
  );

  const finishGame = useCallback(
    async (turn: Turn, nextTurns: Turn[]) => {
      setIsConfettiing(true);
      setIsGameFinished(true);
      setIsWinnerModalVisible(true);

      const winner = players[activePlayerIndex];
      if (winner && speak) {
        void speak(`${winner.name.split(' ')[0]} has won!`);
      }

      await persistGame(nextTurns, true);
    },
    [players, activePlayerIndex, speak, persistGame],
  );

  const onThrow = useCallback(
    (thrw: Throw, _pos?: { x: number; y: number }) => {
      if (isGameFinished) return;

      const evalResult = X01GameHelper.evaluateThrow({
        turns,
        currentTurn,
        throw: thrw,
        startingScore,
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
    [isGameFinished, turns, currentTurn, startingScore, speak, finishTurn, finishGame],
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

    if (didPopTurn) rotatePlayers(true);

    setTurns(nextTurns);
    setCurrentTurn(nextTurn);
    setIsWinnerModalVisible(false);
    setIsGameFinished(false);

    void persistGame(nextTurns, false);
  }, [turns, currentTurn, rotatePlayers, persistGame]);

  const dropOutUser = useCallback(
    (userId: string) => {
      if (players.length <= 1) return;

      const leavingIndex = players.findIndex(p => p.id === userId);
      const nextIndex = leavingIndex === players.length - 1 ? 0 : leavingIndex;

      const nextTurns = turns.filter(t => t.userId !== userId);
      const nextPlayers = players.filter(p => p.id !== userId);
      const nextPlayer = nextPlayers[nextIndex];

      setTurns(nextTurns);
      setPlayers(nextPlayers);

      setActivePlayerIndex(nextIndex);

      if (leavingIndex === activePlayerIndex) {
        setCurrentTurn({ userId: nextPlayer.id, throws: [] });
      }

      const remaining =
        startingScore - GameHelper.calculateUserValidScore(nextTurns, nextPlayer.id);
      if (remaining <= 170 && speak) {
        void speak(`${nextPlayer.name.split(' ')[0]} you need ${remaining}`);
      }

      setDropoutPlayerIndex(undefined);
      void persistGame(nextTurns, false);
    },
    [players, turns, setPlayers, activePlayerIndex, startingScore, speak, persistGame],
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
