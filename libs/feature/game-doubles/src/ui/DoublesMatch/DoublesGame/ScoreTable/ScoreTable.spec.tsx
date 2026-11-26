import type { ReactNode } from 'react';
import { render, within } from '@testing-library/react-native';
import {
  DartboardScoreType,
  DoublesOptions,
  GuestUser,
} from '@throwl/shared-domain-models';
import { ScoreTable } from './ScoreTable';

jest.mock('@throwl/shared-ui', () => ({
  ...jest.requireActual(
    '../../../../../../../shared/ui/src/organisms/TeamScoreboard/TeamScoreboard',
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

const players = ['Jan', 'Klaas', 'Piet', 'Bart'].map(
  (name): GuestUser => ({ type: 'guest_user', name }),
);
const gameOptions: DoublesOptions = {
  mode: 'doubles',
  quickMatch: false,
  endOnInvalid: false,
  skipBull: false,
};
const props = {
  players,
  gameOptions,
  width: 360,
  scoreTableRef: { current: null },
  activeUserIndex: 2,
  currentTurn: {
    userId: 'Piet',
    throws: [
      { type: DartboardScoreType.Double, score: 19 },
      { type: DartboardScoreType.Out, score: 0 },
      { type: DartboardScoreType.Double, score: 18 },
    ],
  },
  turns: [
    {
      userId: 'Jan',
      isValid: true,
      throws: [
        { type: DartboardScoreType.Out, score: 0 },
        { type: DartboardScoreType.Double, score: 20 },
      ],
    },
  ],
  setDroppingOutUserIndex: jest.fn(),
};

it('uses team history to credit a teammate who hits the current target', () => {
  const screen = render(
    <ScoreTable
      {...props}
      teams={[{ members: ['Jan', 'Piet'] }, { members: ['Klaas', 'Bart'] }]}
    />,
  );
  const first = within(screen.getByTestId('scoreboard-team-0'));
  expect(first.getByText('Target D17')).toBeTruthy();
  expect(first.getByLabelText('Jan')).toHaveProp('accessibilityValue', {
    text: 'Darts: 2, Avg. per D.: 2',
  });
  expect(first.getByLabelText('Piet, currently throwing')).toHaveProp(
    'accessibilityValue',
    { text: 'Darts: 3, Avg. per D.: 1.5' },
  );
  expect(screen.getByText('Next: Bart')).toBeTruthy();
  expect(
    within(screen.getByTestId('scoreboard-team-1')).getByText('Target D20'),
  ).toBeTruthy();
});

it('keeps the individual current-double column', () => {
  const screen = render(<ScoreTable {...props} />);
  expect(screen.getByText('On curr. D.')).toBeTruthy();
  expect(screen.queryByText(/Target D/)).toBeNull();
  expect(screen.queryByText(/Next:/)).toBeNull();
});
