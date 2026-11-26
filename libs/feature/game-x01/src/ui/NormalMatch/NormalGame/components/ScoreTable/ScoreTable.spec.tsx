import type { ReactNode } from 'react';
import { render, within } from '@testing-library/react-native';
import { DartboardScoreType, GuestUser } from '@throwl/shared-domain-models';
import { ScoreTable } from './ScoreTable';

jest.mock('@throwl/shared-ui', () => ({
  ...jest.requireActual(
    '../../../../../../../../shared/ui/src/organisms/TeamScoreboard/TeamScoreboard',
  ),
  AppLogoArrowLight: () => null,
  SwipeActions: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@throwl/shared-data-access-game', () => ({
  GameService: {
    stubPlayer: (player: GuestUser) => ({ ...player, id: player.name }),
  },
}));
jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: {} }),
}));

const players = Array.from(
  { length: 8 },
  (_, i): GuestUser => ({
    type: 'guest_user',
    name: `Player ${i + 1}`,
  }),
);
const visit = (userId: string, score: number) => ({
  userId,
  isValid: true,
  throws: [{ type: DartboardScoreType.Single, score }],
});
const props = {
  players,
  startingScore: 501,
  width: 360,
  scoreTableRef: { current: null },
  activeUserIndex: 0,
  currentTurn: visit('Player 1', 10),
  turns: [visit('Player 1', 15), visit('Player 2', 20)],
  setDroppingOutUserIndex: jest.fn(),
};

it.each([
  [2, 2],
  [3, 2],
  [2, 3],
  [4, 2],
  [2, 4],
])(
  'groups %i teams of %i and advances the active marker in interleaved order',
  (count, size) => {
    const roster = players.slice(0, count * size);
    const teams = Array.from({ length: count }, (_, i) => ({
      members: roster.slice(i * size, (i + 1) * size).map(({ name }) => name),
    }));
    const screen = render(
      <ScoreTable {...props} players={roster} teams={teams} />,
    );
    teams.forEach(({ members }, index) => {
      const group = within(screen.getByTestId(`scoreboard-team-${index}`));
      for (const name of members) expect(group.getByText(name)).toBeTruthy();
    });
    const firstTeam = within(screen.getByTestId('scoreboard-team-0'));
    expect(firstTeam.getByText('Score 456')).toBeTruthy();
    expect(firstTeam.getByLabelText('Player 1, currently throwing')).toHaveProp(
      'accessibilityValue',
      { text: 'Darts: 2, Last: 15, Avg: 15, Valid Avg: 15' },
    );
    expect(firstTeam.getByLabelText('Player 2')).toHaveProp(
      'accessibilityValue',
      { text: 'Darts: 1, Last: 20, Avg: 20, Valid Avg: 20' },
    );
    expect(screen.getByText(`Next: Player ${size + 1}`)).toBeTruthy();
    screen.rerender(
      <ScoreTable
        {...props}
        players={roster}
        teams={teams}
        currentTurn={{ userId: `Player ${size + 1}`, throws: [] }}
      />,
    );
    expect(
      screen.getByLabelText(`Player ${size + 1}, currently throwing`),
    ).toBeTruthy();
    expect(
      screen.getByText(
        count === 2 ? 'Next: Player 2' : `Next: Player ${size * 2 + 1}`,
      ),
    ).toBeTruthy();
  },
);

it('keeps individual remaining scores in the existing score column', () => {
  const screen = render(
    <ScoreTable {...props} players={players.slice(0, 2)} />,
  );
  expect(screen.getByText('Score')).toBeTruthy();
  expect(screen.getByText('476')).toBeTruthy();
  expect(screen.getByText('481')).toBeTruthy();
  expect(screen.queryByText(/Next:/)).toBeNull();
});
