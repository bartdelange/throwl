import { teamCounts, validRoster } from '@throwl/shared-domain-models';
import { resolveParticipants } from './scoring-participants';

describe('team rotation', () => {
  it.each([
    [4, [2]],
    [5, []],
    [6, [2, 3]],
    [7, []],
    [8, [2, 4]],
    [12, [2, 3, 4, 6]],
  ])('offers legal team counts for %i players', (count, expected) => {
    expect(teamCounts(count)).toEqual(expected);
  });

  it('interleaves teams and identifies the scoring owner', () => {
    const players = ['Jan', 'Klaas', 'Piet', 'Bart'].map((name) => ({
      id: name,
      name,
    }));
    const roster = [
      { members: ['Jan', 'Piet'] },
      { members: ['Klaas', 'Bart'] },
    ];
    const resolved = resolveParticipants(players, roster);
    expect(resolved.order).toEqual(['Jan', 'Klaas', 'Piet', 'Bart']);
    expect(resolved.participantFor('Piet')?.name).toBe('Team 1');
    expect(
      validRoster(resolved.order, [
        { members: ['Jan', 'Piet'] },
        { members: ['Jan', 'Bart'] },
      ]),
    ).toBe(false);
  });
});
