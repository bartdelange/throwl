import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { TeamRoster, validRoster } from '@throwl/shared-domain-models';
import { TeamSetup } from './TeamSetup';

function Setup({ names }: { names: string[] }) {
  const [teams, setTeams] = useState<TeamRoster>();
  return (
    <TeamSetup
      teams={teams}
      players={names.map((name) => ({ id: name, name }))}
      rosterIsValid={Boolean(teams && validRoster(names, teams))}
      onChange={setTeams}
    />
  );
}

it.each([
  [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['2v2v2', '3v3'],
  ],
  [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    ['2v2v2v2', '4v4'],
  ],
])('offers both equal divisions for %j', (names, formats) => {
  const { getByText, queryByText } = render(<Setup names={names} />);
  formats.forEach((format) => expect(getByText(format)).toBeTruthy());
  expect(queryByText('2v2')).toBeNull();
});

it('previews swaps and ordering and preserves a full lineup when shuffled', () => {
  const names = ['Jan', 'Klaas', 'Piet', 'Bart'];
  const {
    getByText,
    getByText: get,
    rerender,
  } = render(<Setup names={names} />);
  fireEvent.press(get('2v2'));
  expect(get('Throwing order: Jan → Piet → Klaas → Bart')).toBeTruthy();
  fireEvent.press(get('Klaas'));
  fireEvent.press(get('Piet'));
  expect(get('Throwing order: Jan → Klaas → Piet → Bart')).toBeTruthy();
  fireEvent.press(get('Move Team 2 earlier'));
  expect(get('Throwing order: Klaas → Jan → Bart → Piet')).toBeTruthy();
  fireEvent.press(get('Move Piet earlier'));
  expect(get('Throwing order: Klaas → Piet → Bart → Jan')).toBeTruthy();
  fireEvent.press(get('Shuffle teams'));
  expect(
    getByText(/^Throwing order:/)
      .props.children.replace('Throwing order: ', '')
      .split(' → ')
      .sort(),
  ).toEqual([...names].sort());
  rerender(<Setup names={names.slice(0, 3)} />);
  expect(get(/Select a team format/)).toBeTruthy();
});
