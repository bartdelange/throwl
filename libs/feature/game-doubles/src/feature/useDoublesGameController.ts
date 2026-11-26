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
import {
  DoublesOptions,
  Throw,
  Turn,
  TeamRoster,
} from '@throwl/shared-domain-models';
import {
  GameHelper,
  TurnNeeded,
  ScoringParticipant,
  resolveParticipants,
} from '@throwl/shared-domain-game-rules';
import { DoublesGameHelper } from '@throwl/shared-domain-game-rules';

type PlayerBase = { id: string; name: string };

export function useDoublesGameController<TPlayer extends PlayerBase>(args: {
  players: TPlayer[];
  teams?: TeamRoster;
  setPlayers: Dispatch<SetStateAction<TPlayer[]>>;

  options: DoublesOptions;
  activeGame?: { id: string; turns: Turn[] } | undefined;

  scoreTableRef: RefObject<FlatList<ScoringParticipant> | null>;

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
  const {
    players,
    teams,
    setPlayers,
    options,
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
    return DoublesGameHelper.calculateTurnNeeded(
      turns,
      currentTurn,
      options,
      lineup.participantFor(currentTurn.userId)?.members,
    );
  }, [turns, currentTurn, options, lineup]);

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

      const winner = lineup.participantFor(turn.userId);
      if (winner && speak)
        void speak(
          `${teams ? winner.name : winner.name.split(' ')[0]} has won!`,
        );

      await persistGame(nextTurns, true);
    },
    [turns, lineup, teams, speak, persistGame],
  );

  const onThrow = useCallback(
    (thrw: Throw) => {
      if (isGameFinished) return;

      const before = DoublesGameHelper.getNextDoubleNeeded(
        [...turns, currentTurn],
        lineup.participantFor(currentTurn.userId)?.members ?? [
          currentTurn.userId,
        ],
        options,
      );
      const expectedNext = before.next;

      const { isThrowValid } = DoublesGameHelper.evaluateThrow(
        thrw,
        expectedNext,
        options,
      );

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
        lineup.participantFor(nextTurn.userId)?.members ?? [nextTurn.userId],
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
    [
      isGameFinished,
      turns,
      currentTurn,
      options,
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
    setCurrentTurn({
      ...nextTurn,
      isValid: nextTurn.throws.every((dart) => dart.isValid !== false),
    });
    setIsWinnerModalVisible(false);
    setIsGameFinished(false);

    void persistGame(nextTurns, false);
  }, [turns, currentTurn, indexFor, scrollToPlayer, persistGame]);

  const dropOutUser = useCallback(
    (userId: string) => {
      if (teams || players.length <= 1) return;

      const leavingIndex = players.findIndex((p) => p.id === userId);
      const nextIndex = leavingIndex === players.length - 1 ? 0 : leavingIndex;

      const nextTurns = turns.filter((t) => t.userId !== userId);
      const nextPlayers = players.filter((p) => p.id !== userId);
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
    [players, teams, turns, setPlayers, activePlayerIndex, persistGame],
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
