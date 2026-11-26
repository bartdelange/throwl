import {
  DartboardScoreType,
  DoublesOptions,
  Game,
} from '@throwl/shared-domain-models';
import { GameHelper } from './game_helper';
import { getGameWinner } from './game-result';
import { participantVisits } from './scoring-participants';
import { DoublesGameHelper } from './doubles_game_helper';

it('attributes a teammate’s ladder hit to the person who actually threw it', () => {
  const jan = {
    userId: 'Jan',
    throws: [{ type: DartboardScoreType.Double, score: 20 }],
  };
  const piet = {
    userId: 'Piet',
    throws: [{ type: DartboardScoreType.Double, score: 19 }],
  };
  const teamVisits = [jan, piet];
  const options = {
    mode: 'doubles' as const,
    quickMatch: false,
    skipBull: false,
    endOnInvalid: true,
  };
  expect(
    GameHelper.getPostDoublesGameTurnStats(teamVisits, options),
  ).toMatchObject({
    totalTurns: 2,
    totalDarts: 2,
    notOnTarget: 0,
    consecutiveDoublesStreak: 2,
  });
  expect(
    GameHelper.getPostDoublesGameTurnStats([piet], options, teamVisits, 'Piet'),
  ).toMatchObject({
    totalTurns: 1,
    totalDarts: 1,
    notOnTarget: 0,
    consecutiveDoublesStreak: 1,
  });
  expect(
    GameHelper.getPostDoublesGameTurnStats(
      [],
      options,
      teamVisits,
      'No visits',
    ),
  ).toMatchObject({
    totalTurns: 0,
    totalDarts: 0,
    notOnTarget: 0,
    consecutiveDoublesStreak: 0,
  });
});

it('combines chronological visits without charging a partial bust against team progress', () => {
  const triple = (score: number) => ({
    type: DartboardScoreType.Triple,
    score,
  });
  const double = (score: number) => ({
    type: DartboardScoreType.Double,
    score,
  });
  const miss = { type: DartboardScoreType.Out, score: 0 };
  const turns = [
    {
      userId: 'Jan',
      isValid: true,
      throws: [triple(20), triple(20), triple(20)],
    },
    { userId: 'Klaas', isValid: true, throws: [triple(20), miss, miss] },
    { userId: 'Piet', isValid: false, throws: [triple(20), triple(20)] },
    { userId: 'Bart', isValid: true, throws: [miss, miss, miss] },
    {
      userId: 'Jan',
      isValid: true,
      throws: [triple(20), triple(15), double(8)],
    },
  ];
  const game: Game = {
    id: 'match',
    playerIds: [],
    players: ['Jan', 'Klaas', 'Piet', 'Bart'].map((name) => ({
      type: 'guest_user',
      name,
    })),
    teams: [{ members: ['Jan', 'Piet'] }, { members: ['Klaas', 'Bart'] }],
    started: new Date(0),
    finished: new Date(1000),
    options: { mode: 'x01', startingScore: 301 },
    turns,
  };
  const visits = participantVisits(game.turns, ['Jan', 'Piet']);
  expect(visits.map(GameHelper.calculateTurnScore)).toEqual([180, 120, 121]);
  expect(
    GameHelper.getPostNormalGameTurnStats(visits, 301, undefined, true),
  ).toMatchObject({
    totalTurns: 3,
    totalDarts: 8,
    invalid: 1,
    amount180: 1,
    under170: 2,
    under100: 1,
  });
  expect(
    GameHelper.calculateInNormalGameScoreStatsForUser(visits, 301),
  ).toMatchObject({
    avg: 140.33,
    validAvg: 150.5,
    score: 0,
  });
  expect(GameHelper.getPostNormalGameThrowStats(visits)).toEqual({
    triples: 7,
    doubles: 1,
    out: 0,
  });
  const scoringDarts = visits
    .filter(({ isValid }) => isValid)
    .flatMap(({ throws }) => throws);
  expect(GameHelper.getThrowCounts(scoringDarts)[0][1]).toEqual({
    throw: triple(20),
    count: 4,
  });
  expect(
    GameHelper.getPostNormalGameTurnStats(visits, 301, 'Piet'),
  ).toMatchObject({
    totalTurns: 1,
    totalDarts: 2,
    invalid: 1,
    under100: 0,
  });
  expect(
    GameHelper.getPostNormalGameTurnStats(visits, 301, 'No visits'),
  ).toMatchObject({ totalTurns: 0, totalDarts: 0 });
  expect(getGameWinner(game)).toMatchObject({
    participant: { members: ['Jan', 'Piet'] },
    visit: { userId: 'Jan', throws: [triple(20), triple(15), double(8)] },
  });
  expect(GameHelper.getPostNormalGameTurnStats(visits, 301).under100).toBe(2);
});

it('derives Doubles averages from actual darts and hits across unequal team visits', () => {
  const double = (score: number) => ({
    type: DartboardScoreType.Double,
    score,
  });
  const miss = { type: DartboardScoreType.Out, score: 0, isValid: false };
  const jan = { userId: 'Jan', isValid: false, throws: [double(20), miss] };
  const piet = { userId: 'Piet', throws: [double(19), double(18), miss] };
  const opts: DoublesOptions = {
    mode: 'doubles',
    endOnInvalid: true,
    quickMatch: false,
    skipBull: false,
  };
  const visits = [jan, piet];
  expect(GameHelper.getPostDoublesGameTurnStats(visits, opts)).toMatchObject({
    totalTurns: 2,
    totalDarts: 5,
    notOnTarget: 2,
    invalidTrows: 2,
    avgDartsPerDouble: 1.67,
  });
  expect(
    GameHelper.getPostDoublesGameTurnStats([piet], opts, visits, 'Piet'),
  ).toMatchObject({
    totalTurns: 1,
    totalDarts: 3,
    notOnTarget: 1,
    avgDartsPerDouble: 1.5,
  });
  expect(
    DoublesGameHelper.getNextDoubleNeeded(visits, ['Jan', 'Piet'], opts).next,
  ).toEqual(double(17));
});
