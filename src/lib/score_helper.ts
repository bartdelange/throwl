import { DartboardScoreType, Throw } from '~/models/throw';
import { Turn } from '~/models/turn';

export interface UserScoreStats {
  last: number;
  avg: number;
  validAvg: number;
  score: number;
}

export interface ThrowCount {
  throw: Throw;
  count: number;
}

export interface TurnStats {
  total: number;
  invalid: number;
  under170: number;
  under100: number;
  between30and50: number;
  between50and100: number;
  moreThan100: number;
}

export interface ThrowStats {
  triples: number;
  doubles: number;
  out: number;
}

export class ScoreHelper {
  static calculateTurnScore(turn: Turn): number {
    if (!turn) return 0;
    return turn.throws.reduce<number>((prev, thrw) => {
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
      }
    }, 0);
  }

  static getThrowCounts(throws: Throw[]): [string, ThrowCount][] {
    const throwCountMap: Map<string, ThrowCount> = new Map<
      string,
      ThrowCount
    >();
    for (const thrw of throws) {
      if (throwCountMap.has(`${thrw.type}/${thrw.score}`)) {
        throwCountMap.set(`${thrw.type}/${thrw.score}`, {
          throw: thrw,
          count:
            (throwCountMap.get(`${thrw.type}/${thrw.score}`)?.count || 1) + 1,
        });
      } else {
        throwCountMap.set(`${thrw.type}/${thrw.score}`, {
          throw: thrw,
          count: 1,
        });
      }
    }

    return Array.from(throwCountMap.entries()).sort((a, b) => {
      return b[1].count - a[1].count;
    });
  }

  static calculateHeatmap(
    throwCount: [string, ThrowCount][]
  ): Map<string, number> {
    let min: number | null = null;
    let max: number | null = null;
    if (throwCount.length) {
      max = throwCount[0][1].count;
      min = throwCount[throwCount.length - 1][1].count;
    }

    const generatedHeatmap = new Map<string, number>();

    if (throwCount.length && min !== null && max !== null) {
      for (const throwCountElement of throwCount) {
        generatedHeatmap.set(
          throwCountElement[0],
          max - min === 0 ? 1 : (throwCountElement[1].count - min) / (max - min)
        );
      }
    }

    return generatedHeatmap;
  }

  static getTurnStats(turns: Turn[], staringScore: number): TurnStats {
    let score = staringScore;
    let total = 0;
    let invalid = 0;
    let under170 = 0;
    let under100 = 0;
    let between30and50 = 0;
    let between50and100 = 0;
    let moreThan100 = 0;

    for (const turn of turns) {
      const turnScore = this.calculateTurnScore(turn);
      score -= turnScore;
      total++;

      if (score < 170 && score >= 100) {
        under170++;
      }

      if (score < 100) {
        under100++;
      }

      if (!turn.isValid) {
        invalid++;
        continue;
      }

      if (turnScore > 30 && turnScore <= 50) {
        between30and50++;
      }

      if (turnScore > 50 && turnScore <= 100) {
        between50and100++;
      }

      if (turnScore > 100) {
        moreThan100++;
      }
    }

    return {
      total,
      invalid,
      under170,
      under100,
      between30and50,
      between50and100,
      moreThan100,
    };
  }

  static getThrowStats(turns: Turn[]): ThrowStats {
    const throws = turns.flatMap(element => element.throws);
    const doubles = throws.reduce<number>(
      (previousValue, element) =>
        previousValue + (element.type == DartboardScoreType.Double ? 1 : 0),
      0
    );
    const triples = throws.reduce<number>(
      (previousValue, element) =>
        previousValue + (element.type == DartboardScoreType.Triple ? 1 : 0),
      0
    );
    const out = throws.reduce<number>(
      (previousValue, element) =>
        previousValue + (element.type == DartboardScoreType.Out ? 1 : 0),
      0
    );

    return {
      triples,
      doubles,
      out,
    };
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
