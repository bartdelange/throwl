import { Throw } from '~/models/throw';
import { Turn } from '~/models/turn';

interface UserScoreStats {
  last: number;
  avg: number;
  validAvg: number;
  score: number;
}

export class ScoreHelper {
  static calculateTurnScore(turn: Turn): number {
    if (!turn) return 0;
    return turn.throws.reduce<number>((prev, thrw) => {
      switch (thrw.type) {
        case 'out':
          return prev + 0;
        case 'bull':
          return prev + thrw.score;
        case 'single':
          return prev + thrw.score;
        case 'double':
          return prev + thrw.score * 2;
        case 'triple':
          return prev + thrw.score * 3;
      }
    }, 0);
  }

  static calculateScore(
    userTurns: Turn[],
    checkValid: boolean = false
  ): number {
    return userTurns
      .filter(turn => turn.isValid || !checkValid)
      .reduce<number>((prev, turn) => prev + this.calculateTurnScore(turn), 0);
  }

  static checkThrowValidity(
    currentTurn: Turn,
    userScore: number,
    startingScore: number
  ): boolean {
    const remainingScore = startingScore - userScore;

    if (remainingScore === 0) {
      const lastThrow = currentTurn.throws[currentTurn.throws.length - 1];
      return (
        lastThrow.type === 'double' ||
        (lastThrow.type === 'bull' && lastThrow.score === 50)
      );
    }
    return remainingScore > 1;
  }

  static calculateScoreStatsForUser(
    userTurns: Turn[],
    startingScore: number,
    currentTurn?: Turn
  ): UserScoreStats {
    const summedScore = this.calculateScore(userTurns);
    const summedValidScore = this.calculateScore(userTurns, true);

    const currentTurnScore = currentTurn
      ? this.calculateTurnScore(currentTurn)
      : 0;

    return {
      last: this.calculateTurnScore(userTurns[userTurns.length - 1]),
      avg: Number((summedScore / userTurns.length || 0).toFixed(2)),
      validAvg: Number(
        (
          summedValidScore / userTurns.filter(t => t.isValid).length || 0
        ).toFixed(2)
      ),
      score: startingScore - (summedValidScore + currentTurnScore),
    };
  }

  static createScoreString(thrw: Throw): string {
    if (!thrw) return '-';
    if (thrw.type === 'out') return 'Out';
    return `${thrw.type[0].toUpperCase()}${thrw.score}`;
  }
}
