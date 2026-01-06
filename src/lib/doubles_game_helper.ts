import { DartboardScoreType, Throw } from '~/models/throw.ts';
import { Turn } from '~/models/turn.ts';
import { DoublesOptions } from '~/models/game.ts';
import { GameHelper, TurnNeeded } from '~/lib/game_helper.ts';

export class DoublesGameHelper {
  static buildTargets(opts: DoublesOptions): Throw[] {
    const minDouble = opts.quickMatch ? 10 : 1;

    const targets: Throw[] = [];
    for (let n = 20; n >= minDouble; n--) {
      targets.push({ type: DartboardScoreType.Double, score: n } as Throw);
    }

    if (!opts.skipBull) {
      targets.push({ type: DartboardScoreType.Bull, score: 25 } as Throw);
      targets.push({ type: DartboardScoreType.Bull, score: 50 } as Throw);
    }

    return targets;
  }

  static sameTarget(a: Throw, b: Throw): boolean {
    return a.type === b.type && a.score === b.score;
  }

  static getValidProgressThrows(allTurns: Turn[], userId: string): Throw[] {
    return (allTurns ?? [])
      .filter(t => t.userId === userId)
      .flatMap(t => t.throws ?? [])
      .filter(
        (t): t is Throw =>
          !!t &&
          t.isValid !== false &&
          (t.type === DartboardScoreType.Double || t.type === DartboardScoreType.Bull),
      );
  }

  static getNextDoubleNeeded(
    allTurns: Turn[],
    userId: string,
    opts: DoublesOptions,
  ): { next: Throw | undefined; nextIndex: number; targets: Throw[]; isComplete: boolean } {
    const targets = this.buildTargets(opts);
    const validProgress = this.getValidProgressThrows(allTurns, userId);

    let nextIndex = 0;
    for (; nextIndex < targets.length; nextIndex++) {
      const needed = targets[nextIndex];
      const hit = validProgress.some(v => this.sameTarget(v, needed));
      if (!hit) break;
    }

    return {
      next: targets[nextIndex],
      nextIndex,
      targets,
      isComplete: nextIndex >= targets.length,
    };
  }

  static evaluateThrow(
    thrw: Throw,
    expectedNext: Throw | undefined,
    opts: DoublesOptions,
  ): { isThrowValid: boolean; reason?: 'out' | 'wrong_target' } {
    if (thrw.type === DartboardScoreType.Out) return { isThrowValid: true, reason: 'out' };

    if (opts.endOnInvalid && expectedNext && !this.sameTarget(thrw, expectedNext)) {
      return { isThrowValid: false, reason: 'wrong_target' };
    }

    return { isThrowValid: true };
  }

  static calculateTurnNeeded(turns: Turn[], currentTurn: Turn, opts: DoublesOptions): TurnNeeded {
    const allTurns = [...turns, currentTurn];

    if (opts.endOnInvalid && (currentTurn.throws ?? []).some(t => t?.isValid === false)) {
      return [undefined, undefined, undefined];
    }

    const { targets, nextIndex } = this.getNextDoubleNeeded(allTurns, currentTurn.userId, opts);

    const nextThree: TurnNeeded = [
      targets[nextIndex],
      targets[nextIndex + 1],
      targets[nextIndex + 2],
    ];

    const alreadyThrownCount = (currentTurn.throws ?? []).length;
    const out: TurnNeeded = [undefined, undefined, undefined];

    for (let i = 0; i < 3; i++) {
      out[i] = i < alreadyThrownCount ? undefined : nextThree[i - alreadyThrownCount];
    }

    return out;
  }

  static getNextPlayerIndexFromLastTurn(args: {
    turns: Turn[];
    players: Array<{ id: string }>;
    currentPlayersLength: number;
  }): number {
    const { turns, players, currentPlayersLength } = args;
    const lastTurn = turns[turns.length - 1];
    if (!lastTurn) return 0;

    const lastIndex = players.findIndex(p => p.id === lastTurn.userId);
    return GameHelper.getNextUserIndex({
      activeUserIndex: lastIndex,
      playersLength: currentPlayersLength,
    });
  }
}
