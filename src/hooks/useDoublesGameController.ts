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
import { DoublesOptions } from '~/models/game.ts';
import { GameHelper, TurnNeeded } from '~/lib/game_helper.ts';
import { DoublesGameHelper } from '~/lib/doubles_game_helper.ts';
import { GuestUser, User } from '~/models/user.ts';

type PlayerBase = { id: string; name: string };

export function useDoublesGameController<TPlayer extends PlayerBase>(args: {
  players: TPlayer[];
  setPlayers: Dispatch<SetStateAction<TPlayer[]>>;

  options: DoublesOptions;
  activeGame?: { id: string; turns: Turn[] } | undefined;

  scoreTableRef: RefObject<FlatList<User | GuestUser> | null>;

  speak?: (text: string) => Promise<void> | void;
  persistGame: (turns: Turn[], finished: boolean) => Promise<void> | void;
}): {
  turns: Turn[];
  currentTurn: Turn;
  activePlayerIndex: number;

  turnNeeded: TurnNeeded;

  isGameFinished: boolean;
  isWinnerModalVisible: boolean;
  isConfettiing: boolean;

  dropoutPlayerIndex: number | undefined;
  setDropoutPlayerIndex: (idx: number | undefined) => void;

  onThrow: (thrw: Throw) => void;
  undoThrow: () => void;
  dropOutUser: (userId: string) => void;

  setIsWinnerModalVisible: (v: boolean) => void;
  setIsConfettiing: (v: boolean) => void;
} {
  const { players, setPlayers, options, activeGame, scoreTableRef, speak, persistGame } = args;

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
    return DoublesGameHelper.calculateTurnNeeded(turns, currentTurn, options);
  }, [turns, currentTurn, options]);

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
  }, [activeGame?.id]);

  const finishTurn = useCallback(
    async (turn: Turn) => {
      const nextTurns = [...turns, turn];
      setTurns(nextTurns);

      const nextPlayerIndex = rotatePlayers();
      const nextPlayer = players[nextPlayerIndex];
      setCurrentTurn({ userId: nextPlayer.id, throws: [] });

      await persistGame(nextTurns, false);
    },
    [turns, rotatePlayers, players, persistGame],
  );

  const finishGame = useCallback(
    async (turn: Turn) => {
      const nextTurns = [...turns, turn];

      setIsConfettiing(true);
      setIsGameFinished(true);
      setIsWinnerModalVisible(true);

      const winner = players[activePlayerIndex];
      if (winner && speak) void speak(`${winner.name.split(' ')[0]} has won!`);

      await persistGame(nextTurns, true);
    },
    [turns, players, activePlayerIndex, speak, persistGame],
  );

  const onThrow = useCallback(
    (thrw: Throw) => {
      if (isGameFinished) return;

      const before = DoublesGameHelper.getNextDoubleNeeded(
        [...turns, currentTurn],
        currentTurn.userId,
        options,
      );
      const expectedNext = before.next;

      const { isThrowValid } = DoublesGameHelper.evaluateThrow(thrw, expectedNext, options);

      const evaluatedThrow: Throw = { ...thrw, isValid: isThrowValid };

      const nextTurn: Turn = {
        ...currentTurn,
        throws: [...(currentTurn.throws ?? []), evaluatedThrow],
        isValid: options.endOnInvalid
          ? currentTurn.isValid !== false && isThrowValid
          : (currentTurn.isValid ?? true),
      };

      setCurrentTurn(nextTurn);

      if (options.endOnInvalid && !isThrowValid) {
        void finishTurn(nextTurn);
        return;
      }

      const after = DoublesGameHelper.getNextDoubleNeeded(
        [...turns, nextTurn],
        nextTurn.userId,
        options,
      );
      if (after.isComplete) {
        void finishGame(nextTurn);
        return;
      }

      if ((nextTurn.throws?.length ?? 0) === 3 || nextTurn.isValid === false) {
        void finishTurn(nextTurn);
      }
    },
    [isGameFinished, turns, currentTurn, options, finishTurn, finishGame],
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

      setDropoutPlayerIndex(undefined);
      void persistGame(nextTurns, false);
    },
    [players, turns, setPlayers, activePlayerIndex, persistGame],
  );

  return {
    turns,
    currentTurn,
    activePlayerIndex,

    turnNeeded,

    isGameFinished,
    isWinnerModalVisible,
    isConfettiing,

    dropoutPlayerIndex,
    setDropoutPlayerIndex,

    onThrow,
    undoThrow,
    dropOutUser,

    setIsWinnerModalVisible,
    setIsConfettiing,
  };
}
