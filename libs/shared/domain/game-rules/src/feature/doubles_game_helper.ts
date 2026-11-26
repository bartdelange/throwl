import {
  DartboardScoreType,
  DoublesOptions,
  Throw,
  Turn,
} from '@throwl/shared-domain-models';
import { participantVisits } from './scoring-participants';
import { GameHelper, TurnNeeded } from './game_helper';

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

  static replay(turns: Turn[], options: DoublesOptions) {
    const targets = this.buildTargets(options);
    let nextIndex = 0;
    const darts = turns.flatMap(({ userId, throws }) =>
      throws.flatMap((dart) => {
        const target = targets[nextIndex];
        if (!target) return [];
        const hit = dart.isValid !== false && this.sameTarget(dart, target);
        const event = { userId, dart, target, targetIndex: nextIndex, hit };
        if (hit) nextIndex++;
        return [event];
      }),
    );
    return { targets, nextIndex, darts };
  }

  static getNextDoubleNeeded(
    allTurns: Turn[],
    members: string | readonly string[],
    opts: DoublesOptions,
  ) {
    const { targets, nextIndex } = this.replay(
      participantVisits(
        allTurns,
        typeof members === 'string' ? [members] : members,
      ),
      opts,
    );
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
    if (thrw.type === DartboardScoreType.Out)
      return { isThrowValid: true, reason: 'out' };

    if (
      opts.endOnInvalid &&
      expectedNext &&
      !this.sameTarget(thrw, expectedNext)
    ) {
      return { isThrowValid: false, reason: 'wrong_target' };
    }

    return { isThrowValid: true };
  }

  static calculateTurnNeeded(
    turns: Turn[],
    currentTurn: Turn,
    opts: DoublesOptions,
    members: readonly string[] = [currentTurn.userId],
  ): TurnNeeded {
    const allTurns = [...turns, currentTurn];

    if (
      opts.endOnInvalid &&
      (currentTurn.throws ?? []).some((t) => t?.isValid === false)
    ) {
      return [undefined, undefined, undefined];
    }

    const { targets, nextIndex } = this.getNextDoubleNeeded(
      allTurns,
      members,
      opts,
    );

    const nextThree: TurnNeeded = [
      targets[nextIndex],
      targets[nextIndex + 1],
      targets[nextIndex + 2],
    ];

    const alreadyThrownCount = (currentTurn.throws ?? []).length;
    const out: TurnNeeded = [undefined, undefined, undefined];

    for (let i = 0; i < 3; i++) {
      out[i] =
        i < alreadyThrownCount ? undefined : nextThree[i - alreadyThrownCount];
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

    const lastIndex = players.findIndex((p) => p.id === lastTurn.userId);
    return GameHelper.getNextUserIndex({
      activeUserIndex: lastIndex,
      playersLength: currentPlayersLength,
    });
  }
}
