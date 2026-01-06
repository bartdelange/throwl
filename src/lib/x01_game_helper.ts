import { Turn } from '~/models/turn.ts';
import { DartboardScoreType, Throw } from '~/models/throw.ts';
import { GameHelper, TurnNeeded } from '~/lib/game_helper.ts';

export class X01GameHelper {
  static checkThrowValidity(currentTurn: Turn, userScore: number, startingScore: number): boolean {
    const remainingScore = startingScore - userScore;

    // Finish must be double or bull(50)
    if (remainingScore === 0) {
      const lastThrow = currentTurn.throws[currentTurn.throws.length - 1];
      return (
        lastThrow.type === DartboardScoreType.Double ||
        (lastThrow.type === DartboardScoreType.Bull && lastThrow.score === 50)
      );
    }

    // Cannot leave 1 (or <= 1) remaining in double-out
    return remainingScore > 1;
  }

  static evaluateThrow(args: {
    turns: Turn[];
    currentTurn: Turn;
    throw: Throw;
    startingScore: number;
  }): {
    nextTurn: Turn;
    turnScore: number;
    totalScore: number;
    remaining: number;
    isValid: boolean;
    isWin: boolean;
    shouldEndTurn: boolean;
  } {
    const { turns, currentTurn, throw: thrw, startingScore } = args;

    const nextTurn: Turn = {
      ...currentTurn,
      throws: [...(currentTurn.throws ?? []), thrw],
    };

    const previous = GameHelper.calculateUserValidScore(turns, nextTurn.userId);
    const turnScore = GameHelper.calculateTurnScore(nextTurn);
    const totalScore = previous + turnScore;

    const isValid = this.checkThrowValidity(nextTurn, totalScore, startingScore);
    nextTurn.isValid = isValid;

    const remaining = startingScore - totalScore;
    const isWin = remaining === 0 && isValid;

    const dartsThrown = nextTurn.throws?.length ?? 0;
    const shouldEndTurn = dartsThrown === 3 || !isValid;

    return { nextTurn, turnScore, totalScore, remaining, isValid, isWin, shouldEndTurn };
  }

  static calculateTurnNeeded(args: {
    turns: Turn[];
    currentTurn: Turn;
    startingScore: number;
    finishers: Record<number, Throw[] | undefined>;
  }): TurnNeeded {
    const { turns, currentTurn, startingScore, finishers } = args;

    // TODO: Allow for more then one finisher and pick the one that satisfies darts left in turn
    // Case of 101 score, current one requires 3 darts but you can finish it in two with triple 17 and bullseye
    // Should be done by extending finishers table and by checking if there is overlap what the user already thrown
    // Needed vars would be scoreStartOfTurn, scoreInTurn, userThrows

    const previous = GameHelper.calculateUserValidScore(turns, currentTurn.userId);
    const inTurn = GameHelper.calculateTurnScore(currentTurn);
    const total = previous + inTurn;

    const isValid = this.checkThrowValidity(currentTurn, total, startingScore);
    if (!isValid) return [undefined, undefined, undefined];

    const left = startingScore - total;
    const finisher = finishers[left];

    const dartsLeft = 3 - (currentTurn.throws?.length ?? 0);
    if (!finisher || finisher.length > dartsLeft) return [undefined, undefined, undefined];

    const out: TurnNeeded = [undefined, undefined, undefined];

    for (let i = currentTurn.throws.length; i < 3; i++) {
      out[i] = finisher[i - currentTurn.throws.length];
    }

    return out;
  }
}
