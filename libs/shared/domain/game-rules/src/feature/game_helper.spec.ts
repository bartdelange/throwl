import { GameHelper } from './game_helper';

describe('GameHelper', () => {
  it('wraps the next user index', () => {
    expect(
      GameHelper.getNextUserIndex({ activeUserIndex: 2, playersLength: 3 }),
    ).toBe(0);
  });
});
