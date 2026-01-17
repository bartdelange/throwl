import { DartboardScoreType, Throw, Turn } from '@throwl/shared-domain-models';
import { GameStatsHelper } from './game_stats_helper';

export type TurnNeeded = [
  Throw | undefined,
  Throw | undefined,
  Throw | undefined,
];

export class GameHelper {
  static getThrowCounts = GameStatsHelper.getThrowCounts;
  static calculateInNormalGameScoreStatsForUser =
    GameStatsHelper.calculateInNormalGameScoreStatsForUser;
  static calculateInDoublesGameScoreStatsForUser =
    GameStatsHelper.calculateInDoublesGameScoreStatsForUser;
  static calculateHeatmap = GameStatsHelper.calculateHeatmap;
  static getPostNormalGameThrowStats =
    GameStatsHelper.getPostNormalGameThrowStats;
  static getPostNormalGameTurnStats =
    GameStatsHelper.getPostNormalGameTurnStats;
  static getPostDoublesGameTurnStats =
    GameStatsHelper.getPostDoublesGameTurnStats;

  static calculateTurnScore(turn: Turn): number {
    if (!turn) return 0;

    return (turn.throws ?? []).reduce<number>((prev, thrw) => {
      switch (thrw.type) {
        case DartboardScoreType.Out:
          return prev;
        case DartboardScoreType.Bull:
          return prev + thrw.score;
        case DartboardScoreType.Single:
          return prev + thrw.score;
        case DartboardScoreType.Double:
          return prev + thrw.score * 2;
        case DartboardScoreType.Triple:
          return prev + thrw.score * 3;
        default:
          return prev;
      }
    }, 0);
  }

  static calculateScore(turns: Turn[], checkValid = false): number {
    return (turns ?? [])
      .filter((t) => (checkValid ? t.isValid : true))
      .reduce((acc, t) => acc + this.calculateTurnScore(t), 0);
  }

  static calculateUserValidScore(allTurns: Turn[], userId: string): number {
    return this.calculateScore(
      (allTurns ?? []).filter((t) => t.userId === userId && t.isValid),
      false,
    );
  }

  static createScoreString(thrw: Throw): string {
    if (!thrw) return '-';
    if (thrw.type === DartboardScoreType.Out) return 'Out';
    if (thrw.type === DartboardScoreType.Bull) return `B${thrw.score}`;
    return `${thrw.type[0].toUpperCase()}${thrw.score}`;
  }

  static getNextUserIndex(args: {
    activeUserIndex: number;
    playersLength: number;
    reverse?: boolean;
    customIndex?: number;
  }): number {
    const {
      activeUserIndex,
      playersLength,
      reverse = false,
      customIndex,
    } = args;

    let next =
      customIndex !== undefined && customIndex !== null
        ? customIndex + (reverse ? -1 : 1)
        : activeUserIndex + (reverse ? -1 : 1);

    if (next >= playersLength) next = 0;
    if (next < 0) next = playersLength - 1;

    return next;
  }

  static undoLastThrow(args: { turns: Turn[]; currentTurn: Turn }): {
    turns: Turn[];
    currentTurn: Turn;
    didPopTurn: boolean;
  } {
    const turnsCopy = [...(args.turns ?? [])];
    let turnCopy: Turn = {
      ...args.currentTurn,
      throws: [...(args.currentTurn.throws ?? [])],
    };

    let didPopTurn = false;

    if (!(turnCopy.throws?.length ?? 0)) {
      const lastTurn = turnsCopy.pop();
      if (!lastTurn) {
        return {
          turns: args.turns,
          currentTurn: args.currentTurn,
          didPopTurn: false,
        };
      }
      turnCopy = { ...lastTurn, throws: [...(lastTurn.throws ?? [])] };
      didPopTurn = true;
    }

    turnCopy.throws.pop();
    return { turns: turnsCopy, currentTurn: turnCopy, didPopTurn };
  }
}
