import {
  DartboardScoreType as Dart,
  Game,
  Turn,
} from '@throwl/shared-domain-models';
import { getGameWinner } from '../index';

const out = { type: Dart.Out, score: 0 };
const game: Game = {
  id: 'game',
  started: new Date(),
  finished: new Date(),
  options: { mode: 'x01', startingScore: 101 },
  players: ['Jan', 'Klaas', 'Piet', 'Bart'].map((name) => ({
    type: 'guest_user',
    name,
  })),
  teams: [{ members: ['Jan', 'Piet'] }, { members: ['Klaas', 'Bart'] }],
  turns: [],
};

it('credits checkout to its thrower and victory to the teammate with no visit', () => {
  const checkout: Turn = {
    userId: 'Jan',
    isValid: true,
    throws: [
      { type: Dart.Triple, score: 17 },
      { type: Dart.Bull, score: 50 },
    ],
  };
  expect(getGameWinner({ ...game, turns: [checkout] })).toMatchObject({
    participant: { members: ['Jan', 'Piet'] },
    visit: checkout,
  });
  expect(
    getGameWinner({ ...game, finished: undefined, turns: [checkout] }),
  ).toBeUndefined();
  expect(
    getGameWinner({
      ...game,
      turns: [checkout, { userId: 'Klaas', throws: [out, out, out] }],
    }),
  ).toBeUndefined();
});

it('requires a real double-out rather than trusting a stored finish marker', () => {
  const options = { mode: 'x01' as const, startingScore: 40 };
  expect(
    getGameWinner({
      ...game,
      options,
      turns: [
        {
          userId: 'Jan',
          isValid: true,
          throws: [
            { type: Dart.Single, score: 20 },
            { type: Dart.Single, score: 20 },
          ],
        },
      ],
    }),
  ).toBeUndefined();
});

it('requires the entire shared Doubles ladder and the actual final dart', () => {
  const options = {
    mode: 'doubles' as const,
    quickMatch: true,
    skipBull: true,
    endOnInvalid: true,
  };
  const hits = (userId: string, ...scores: number[]): Turn => ({
    userId,
    throws: scores.map((score) => ({ type: Dart.Double, score })),
  });
  const miss = (userId: string): Turn => ({ userId, throws: [out, out, out] });
  const turns = [
    hits('Jan', 20, 19, 18),
    miss('Klaas'),
    hits('Piet', 17, 16, 15),
    miss('Bart'),
    hits('Jan', 14, 13, 12),
    miss('Klaas'),
  ];
  expect(getGameWinner({ ...game, options, turns })).toBeUndefined();
  const finish = hits('Piet', 11, 10);
  expect(
    getGameWinner({ ...game, options, turns: [...turns, finish] }),
  ).toMatchObject({ visit: finish });
  expect(
    getGameWinner({
      ...game,
      options,
      turns: [...turns, hits('Piet', 11, 9, 10)],
    }),
  ).toBeUndefined();
});
