import { DartboardScoreType } from '@throwl/shared-domain-models';
import { GameHelper } from './game_helper';

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
