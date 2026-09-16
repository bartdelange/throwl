import {
  deserializeGameParam,
  serializeGameParam,
} from '@throwl/shared-constants';
import { DartboardScoreType, Game } from '@throwl/shared-domain-models';

describe('game navigation params', () => {
  const game: Game = {
    id: 'game-1',
    players: [
      {
        type: 'user',
        id: 'u1',
        email: 'alice@example.com',
        name: 'Alice',
      },
      { type: 'guest_user', name: 'Guest' },
    ],
    turns: [
      {
        userId: 'u1',
        username: 'Alice',
        isValid: true,
        throws: [
          { type: DartboardScoreType.Triple, score: 20 },
          { type: DartboardScoreType.Double, score: 20, isValid: true },
        ],
      },
    ],
    started: new Date('2026-09-16T18:00:00.000Z'),
    finished: new Date('2026-09-16T18:30:00.000Z'),
    options: { mode: 'x01', startingScore: 501 },
    startingScore: 501,
  };

  it('creates JSON-safe route state without leaking rich domain values', () => {
    const routeGame = serializeGameParam(game);

    expect(routeGame.started).toBe('2026-09-16T18:00:00.000Z');
    expect(routeGame.finished).toBe('2026-09-16T18:30:00.000Z');
    expect(JSON.parse(JSON.stringify(routeGame))).toEqual(routeGame);
    expect(routeGame).not.toBe(game);
    expect(routeGame.players[0]).not.toBe(game.players[0]);
    expect(routeGame.turns[0]).not.toBe(game.turns[0]);
  });

  it('reconstructs Date values at the domain boundary', () => {
    const restored = deserializeGameParam(serializeGameParam(game));

    expect(restored).toEqual(game);
    expect(restored.started).toBeInstanceOf(Date);
    expect(restored.finished).toBeInstanceOf(Date);
  });

  it('omits absent optional values instead of adding undefined route state', () => {
    const routeGame = serializeGameParam({
      ...game,
      finished: undefined,
      startingScore: undefined,
      turns: [{ userId: 'Guest', throws: [] }],
    });

    expect(routeGame).not.toHaveProperty('finished');
    expect(routeGame).not.toHaveProperty('startingScore');
    expect(routeGame.turns[0]).not.toHaveProperty('username');
    expect(routeGame.turns[0]).not.toHaveProperty('isValid');
  });
});
