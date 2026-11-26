import {
  DartboardScoreType,
  DoublesOptions,
  Throw,
  Turn,
} from '@throwl/shared-domain-models';
import { GameHelper } from './game_helper';
import { DoublesGameHelper } from './doubles_game_helper';

export interface NormalGameUserScoreStats {
  last: number;
  avg: number;
  validAvg: number;
  score: number;
  turns: number;
  throws: number;
}

export interface DoublesGameUserScoreStats {
  last: number;
  avgDartsPerDouble: number;
  onCurrentDouble: number;
  turns: number;
  throws: number;
}

export interface ThrowCount {
  throw: Throw;
  count: number;
}

export interface NormalGameTurnStats {
  totalTurns: number;
  totalDarts: number;
  invalid: number;
  under170: number;
  under100: number;
  between30and50: number;
  between50and100: number;
  moreThan100: number;
  amount180: number;
}

export interface DoublesGameTurnStats {
  totalTurns: number;
  totalDarts: number;
  invalidTrows: number; // keep name for backwards compat
  notOnTarget: number;
  avgDartsPerDouble: number;
  consecutiveDoublesAmount: number;
  consecutiveDoublesStreak: number;
}

export interface ThrowStats {
  triples: number;
  doubles: number;
  out: number;
}

export class GameStatsHelper {
  static getThrowCounts(throws: Throw[]): [string, ThrowCount][] {
    const throwCountMap: Map<string, ThrowCount> = new Map<
      string,
      ThrowCount
    >();

    for (const thrw of throws ?? []) {
      const key = `${thrw.type}/${thrw.score}`;
      const existing = throwCountMap.get(key);

      if (existing) {
        throwCountMap.set(key, { throw: thrw, count: existing.count + 1 });
      } else {
        throwCountMap.set(key, { throw: thrw, count: 1 });
      }
    }

    return Array.from(throwCountMap.entries()).sort(
      (a, b) => b[1].count - a[1].count,
    );
  }

  static calculateHeatmap(
    throwCount: [string, ThrowCount][],
  ): Map<string, number> {
    let min: number | null = null;
    let max: number | null = null;

    if (throwCount.length) {
      max = throwCount[0][1].count;
      min = throwCount[throwCount.length - 1][1].count;
    }

    const generatedHeatmap = new Map<string, number>();

    if (throwCount.length && min !== null && max !== null) {
      for (const [key, value] of throwCount) {
        generatedHeatmap.set(
          key,
          max - min === 0 ? 1 : (value.count - min) / (max - min),
        );
      }
    }

    return generatedHeatmap;
  }

  static getPostNormalGameThrowStats(turns: Turn[]): ThrowStats {
    const throws = (turns ?? []).flatMap((t) => t.throws ?? []);

    const doubles = throws.reduce<number>(
      (prev, t) => prev + (t.type === DartboardScoreType.Double ? 1 : 0),
      0,
    );
    const triples = throws.reduce<number>(
      (prev, t) => prev + (t.type === DartboardScoreType.Triple ? 1 : 0),
      0,
    );
    const out = throws.reduce<number>(
      (prev, t) => prev + (t.type === DartboardScoreType.Out ? 1 : 0),
      0,
    );

    return { triples, doubles, out };
  }

  static getPostNormalGameTurnStats(
    userTurns: Turn[],
    startingScore: number,
    playerId?: string,
    useValidProgress = playerId !== undefined,
  ): NormalGameTurnStats {
    let score = startingScore;

    let totalTurns = 0;
    let totalDarts = 0;
    let invalid = 0;

    let under170 = 0;
    let under100 = 0;

    let between30and50 = 0;
    let between50and100 = 0;
    let moreThan100 = 0;
    let amount180 = 0;

    for (const turn of userTurns ?? []) {
      const turnScore = GameHelper.calculateTurnScore(turn);
      if (!useValidProgress || turn.isValid !== false) score -= turnScore;
      if (playerId !== undefined && turn.userId !== playerId) continue;

      totalTurns++;
      totalDarts += turn.throws?.length ?? 0;

      if (score < 170 && score >= 100) under170++;
      if (score < 100) under100++;

      if (turn.isValid === false) {
        invalid++;
        continue;
      }

      if (turnScore > 30 && turnScore <= 50) between30and50++;
      if (turnScore > 50 && turnScore <= 100) between50and100++;
      if (turnScore > 100) moreThan100++;
      if (turnScore === 180) amount180++;
    }

    return {
      totalTurns,
      totalDarts,
      invalid,
      under170,
      under100,
      between30and50,
      between50and100,
      moreThan100,
      amount180,
    };
  }

  static getPostDoublesGameTurnStats(
    turns: Turn[],
    options: DoublesOptions,
    teamTurns?: Turn[],
    playerId?: string,
  ): DoublesGameTurnStats {
    const totalTurns = turns.length;
    const totalDarts = turns.reduce((sum, turn) => sum + turn.throws.length, 0);
    const events = DoublesGameHelper.replay(teamTurns ?? turns, options).darts;
    const individual =
      playerId === undefined
        ? events
        : events.filter((event) => event.userId === playerId);
    const invalidTrows = individual.filter(
      ({ dart }) => dart.isValid === false,
    ).length;
    const successfulTargetsHit = individual.filter(({ hit }) => hit).length;
    const notOnTarget = individual.length - successfulTargetsHit;

    let streak = 0;
    let consecutiveDoublesAmount = 0;
    let consecutiveDoublesStreak = 0;
    for (const { userId, hit } of events) {
      streak =
        hit && (playerId === undefined || playerId === userId) ? streak + 1 : 0;
      consecutiveDoublesStreak = Math.max(consecutiveDoublesStreak, streak);
      if (streak === 2) consecutiveDoublesAmount++;
    }

    const avgDartsPerDouble =
      successfulTargetsHit > 0 ? totalDarts / successfulTargetsHit : totalDarts;

    return {
      totalTurns,
      totalDarts,
      invalidTrows,
      notOnTarget,
      avgDartsPerDouble: Number(avgDartsPerDouble.toFixed(2)),
      consecutiveDoublesAmount,
      consecutiveDoublesStreak,
    };
  }

  static calculateInNormalGameScoreStatsForUser(
    userTurns: Turn[],
    startingScore: number,
    currentTurn?: Turn,
  ): NormalGameUserScoreStats {
    const summedScore = GameHelper.calculateScore(userTurns);
    const summedValidScore = GameHelper.calculateScore(userTurns, true);

    const currentTurnScore = currentTurn
      ? GameHelper.calculateTurnScore(currentTurn)
      : 0;

    const validTurnsCount = userTurns.filter((t) => t.isValid).length;

    return {
      last: GameHelper.calculateTurnScore(userTurns[userTurns.length - 1]),
      avg: Number((summedScore / userTurns.length || 0).toFixed(2)),
      validAvg: Number((summedValidScore / validTurnsCount || 0).toFixed(2)),
      score: startingScore - (summedValidScore + currentTurnScore),
      turns: userTurns.length,
      throws:
        userTurns.flatMap((t) => t.throws ?? []).length +
        (currentTurn?.throws?.length ?? 0),
    };
  }

  static calculateInDoublesGameScoreStatsForUser(
    userTurns: Turn[],
    options: DoublesOptions,
    currentTurn?: Turn,
  ): DoublesGameUserScoreStats {
    const allTurns = currentTurn ? [...userTurns, currentTurn] : userTurns;
    const totalDartsThrown = allTurns.reduce(
      (count, turn) => count + turn.throws.length,
      0,
    );
    const { darts, nextIndex: successfulTargetsHit } = DoublesGameHelper.replay(
      allTurns,
      options,
    );
    const onCurrentDouble = darts.filter(
      ({ targetIndex }) => targetIndex === successfulTargetsHit,
    ).length;

    // successfulTargetsHit + 1 because the totalDartsThrown also includes the
    const avgDartsPerDouble =
      successfulTargetsHit > 0
        ? totalDartsThrown / (successfulTargetsHit + 1)
        : totalDartsThrown;

    return {
      last: GameHelper.calculateTurnScore(userTurns[userTurns.length - 1]),
      avgDartsPerDouble: Number(avgDartsPerDouble.toFixed(2)),
      onCurrentDouble: Number(onCurrentDouble.toFixed(2)),
      turns: userTurns.length,
      throws:
        userTurns.flatMap((t) => t.throws ?? []).length +
        (currentTurn?.throws?.length ?? 0),
    };
  }
}
