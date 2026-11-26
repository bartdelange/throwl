import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode, useState } from 'react';
import {
  Button as MockButton,
  Pressable as MockPressable,
  Text as MockText,
} from 'react-native';
import { NewGameProvider } from '../../feature/NewGameContext';
import { SerializablePlayer } from '@throwl/shared-constants';
import { GameModeScreen } from './GameMode/GameMode';
import { GameOptionsScreen } from './GameOptions/GameOptions';
import { PlayerSelectScreen } from './PlayerSelect/PlayerSelect';
import { TeamArrangementScreen } from './TeamArrangement/TeamArrangement';

const names = [
  'Jan',
  'Klaas',
  'Piet',
  'Bart',
  'Greta',
  'Alice',
  'Bob',
  'Charlie',
];
const mockPush = jest.fn();
let mockParams: { players: SerializablePlayer[] } | undefined;

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ push: mockPush }),
}));
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('./NewGame', () => ({
  GameFlowStackNames: {
    GAME_OPTIONS: 'GameOptions',
    PLAYER_SELECT: 'PlayerSelect',
    TEAM_ARRANGEMENT: 'TeamArrangement',
  },
}));
jest.mock('@throwl/feature-auth', () => ({
  useAuthContext: () => ({
    user: { id: 'Jan', name: 'Jan', email: 'test@example.test', type: 'user' },
  }),
}));
jest.mock('@throwl/shared-data-access-game', () => ({
  GameService: {
    stubPlayer: (player: { id?: string; name: string }) => ({
      ...player,
      id: player.id ?? player.name,
    }),
  },
}));
jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: {} }),
}));
jest.mock('@react-native-vector-icons/material-design-icons', () => ({
  MaterialDesignIcons: () => null,
}));
jest.mock('@throwl/shared-ui', () => {
  const { Text, Button } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AppHeader: ({ title, right }: { title: string; right?: ReactNode }) => (
      <>
        <Text>{title}</Text>
        {right}
      </>
    ),
    LogoButton: ({
      label,
      onPress,
      disabled,
    }: {
      label: string;
      onPress: () => void;
      disabled?: boolean;
    }) => <Button title={label} onPress={onPress} disabled={disabled} />,
    AppModal: ({ visible, title }: { visible: boolean; title: string }) =>
      visible ? <Text>{title}</Text> : null,
    FormInput: () => null,
  };
});
jest.mock('./NewGameScreenLayout', () => ({
  NewGameScreenLayout: ({
    children,
    action,
  }: {
    children: ReactNode;
    action: ReactNode;
  }) => (
    <>
      {children}
      {action}
    </>
  ),
}));
jest.mock('./GameOptions/components/X01Options/X01Options', () => ({
  X01OptionsView: () => <MockText>Starting score</MockText>,
}));
jest.mock('./GameOptions/components/DoublesOptions/DoublesOptions', () => ({
  DoublesOptionsView: () => <MockText>Quick match</MockText>,
}));
jest.mock('./PlayerSelect/components/PlayerItem/PlayerItem', () => ({
  PlayerItem: ({
    player,
    onPress,
  }: {
    player: { name: string };
    onPress: () => void;
  }) => (
    <MockPressable onPress={onPress}>
      <MockText>{player.name}</MockText>
    </MockPressable>
  ),
}));
jest.mock('react-native-paper', () => {
  const paper =
    jest.requireActual<typeof import('react-native-paper')>(
      'react-native-paper',
    );
  const { Button } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ...paper,
    IconButton: ({
      accessibilityLabel,
      onPress,
    }: {
      accessibilityLabel: string;
      onPress: () => void;
    }) => <Button title={accessibilityLabel} onPress={onPress} />,
  };
});

function Flow({ count = 0 }: { count?: number }) {
  const [steps, setSteps] = useState(['GameMode']);
  mockPush.mockImplementation(
    (step: string, params?: { players: SerializablePlayer[] }) => {
      if (['GameOptions', 'PlayerSelect', 'TeamArrangement'].includes(step)) {
        if (params) mockParams = params;
        setSteps((previous) => [...previous, step]);
      }
    },
  );
  const step = steps.at(-1);
  return (
    <NewGameProvider
      initialState={{ players: names.slice(0, count), guests: names.slice(1) }}
    >
      {steps.length > 1 && (
        <MockButton
          title="Back"
          onPress={() => setSteps((previous) => previous.slice(0, -1))}
        />
      )}
      {step === 'GameMode' && <GameModeScreen />}
      {step === 'GameOptions' && <GameOptionsScreen />}
      {step === 'PlayerSelect' && <PlayerSelectScreen />}
      {step === 'TeamArrangement' && <TeamArrangementScreen />}
    </NewGameProvider>
  );
}

beforeEach(() => {
  mockPush.mockReset();
  mockParams = undefined;
});

it.each([
  ['Normal', 'NORMAL_GAME', 'Starting score'],
  ['Doubles', 'DOUBLES_GAME', 'Quick match'],
])(
  'defaults to Individual and starts %s from player selection',
  (mode, destination, options) => {
    const screen = render(<Flow count={1} />);
    expect(screen.getByText('Every player plays for themselves.')).toBeTruthy();
    fireEvent.press(screen.getByText(mode));
    fireEvent.press(screen.getByText('Next'));
    expect(screen.getByText(options)).toBeTruthy();
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('GO'));
    expect(mockPush).toHaveBeenLastCalledWith(
      destination,
      expect.objectContaining({
        players: [expect.objectContaining({ name: 'Jan' })],
      }),
    );
    expect(mockPush.mock.calls.at(-1)?.[1]).not.toHaveProperty('teams');
  },
);

function expectThrowingOrder(
  screen: ReturnType<typeof render>,
  names: string[],
) {
  names.forEach((name, index) => {
    expect(screen.getByLabelText(`${name}, throws ${index + 1}`)).toBeTruthy();
  });
}

function openPlayers(screen: ReturnType<typeof render>) {
  fireEvent.press(screen.getByText('Teams'));
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByText('Next'));
}

it.each([
  [4, ['2v2']],
  [6, ['2v2v2', '3v3']],
  [8, ['2v2v2v2', '4v4']],
])('offers only the valid arrangements for %i players', (count, formats) => {
  const screen = render(<Flow count={count} />);
  openPlayers(screen);
  expect(screen.queryByText('Throwing order')).toBeNull();
  fireEvent.press(screen.getByText('Next'));
  expect(screen.getByText('The Teams')).toBeTruthy();
  for (const format of formats) expect(screen.getByText(format)).toBeTruthy();
  fireEvent.press(screen.getByText('GO'));
  expect(mockPush).toHaveBeenLastCalledWith(
    'NORMAL_GAME',
    expect.objectContaining({ teams: expect.any(Array) }),
  );
});

it('explains an invalid count, preserves swaps on Back, and reconciles a changed roster', () => {
  const screen = render(<Flow count={3} />);
  openPlayers(screen);
  expect(screen.getByText(/3 selected/)).toBeTruthy();
  fireEvent.press(screen.getByText('Next'));
  expect(screen.queryByText('The Teams')).toBeNull();
  fireEvent.press(screen.getByText('Bart'));
  expect(screen.getByText(/4 selected/)).toBeTruthy();
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByLabelText('Jan, throws 1'));
  fireEvent.press(screen.getByLabelText('Jan, throws 1'));
  expectThrowingOrder(screen, ['Jan', 'Piet', 'Klaas', 'Bart']);
  fireEvent.press(screen.getByLabelText('Jan, throws 1'));
  fireEvent.press(screen.getByLabelText('Bart, throws 4'));
  expectThrowingOrder(screen, ['Bart', 'Piet', 'Klaas', 'Jan']);
  fireEvent.press(screen.getByText('Back'));
  fireEvent.press(screen.getByText('Next'));
  expectThrowingOrder(screen, ['Bart', 'Piet', 'Klaas', 'Jan']);
  fireEvent.press(screen.getByText('Back'));
  fireEvent.press(screen.getByText('Bart'));
  fireEvent.press(screen.getByText('Greta'));
  fireEvent.press(screen.getByText('Next'));
  expectThrowingOrder(screen, ['Jan', 'Piet', 'Klaas', 'Greta']);
  fireEvent.press(screen.getByText('Back'));
  fireEvent.press(screen.getByText('Back'));
  fireEvent.press(screen.getByText('Back'));
  fireEvent.press(screen.getByText('Individual'));
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByText('GO'));
  expect(mockPush.mock.calls.at(-1)?.[1]).not.toHaveProperty('teams');
});

it('shuffles the teams and throwing order in one action', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  try {
    const screen = render(<Flow count={4} />);
    openPlayers(screen);
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Shuffle teams'));
    expectThrowingOrder(screen, ['Klaas', 'Bart', 'Piet', 'Jan']);
    fireEvent.press(screen.getByText('GO'));
    expect(mockPush).toHaveBeenLastCalledWith(
      'NORMAL_GAME',
      expect.objectContaining({
        teams: [{ members: ['Klaas', 'Piet'] }, { members: ['Bart', 'Jan'] }],
      }),
    );
  } finally {
    random.mockRestore();
  }
});

it('keeps Teams selected when the game mode changes to Doubles', () => {
  const screen = render(<Flow count={4} />);
  expect(screen.getByText(/You start at 501 points/)).toBeTruthy();
  fireEvent.press(screen.getByText('Teams'));
  fireEvent.press(screen.getByText('Doubles'));
  expect(screen.getByText(/You throw consecutive doubles/)).toBeTruthy();
  expect(screen.queryByText(/You start at 501 points/)).toBeNull();
  expect(
    screen.getByText('Teammates share a score and take turns throwing.'),
  ).toBeTruthy();
  fireEvent.press(screen.getByText('Next'));
  expect(screen.getByText('Quick match')).toBeTruthy();
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByText('GO'));
  expect(mockPush).toHaveBeenLastCalledWith(
    'DOUBLES_GAME',
    expect.objectContaining({
      teams: [{ members: ['Jan', 'Klaas'] }, { members: ['Piet', 'Bart'] }],
    }),
  );
});

it('swaps positions within the same team without changing membership', () => {
  const screen = render(<Flow count={4} />);
  openPlayers(screen);
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByLabelText('Jan, throws 1'));
  fireEvent.press(screen.getByLabelText('Klaas, throws 3'));
  expectThrowingOrder(screen, ['Klaas', 'Piet', 'Jan', 'Bart']);
  fireEvent.press(screen.getByText('GO'));
  expect(mockPush).toHaveBeenLastCalledWith(
    'NORMAL_GAME',
    expect.objectContaining({
      teams: [{ members: ['Klaas', 'Jan'] }, { members: ['Piet', 'Bart'] }],
    }),
  );
});

it('offers direct Add guest and shuffle actions for an individual lineup', () => {
  const screen = render(<Flow count={4} />);
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByText('Next'));
  expect(screen.queryByText(/Player limit reached/)).toBeNull();
  fireEvent.press(screen.getByText('Add guest'));
  expect(screen.getByText('ADD A GUEST')).toBeTruthy();

  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  try {
    fireEvent.press(screen.getByText('Randomize players'));
    fireEvent.press(screen.getByText('GO'));
    expect(mockPush).toHaveBeenLastCalledWith(
      'NORMAL_GAME',
      expect.objectContaining({
        players: ['Klaas', 'Piet', 'Bart', 'Jan'].map((name) =>
          expect.objectContaining({ name }),
        ),
      }),
    );
  } finally {
    random.mockRestore();
  }
});

it('shows the player cap once eight are selected', () => {
  const screen = render(<Flow count={8} />);
  fireEvent.press(screen.getByText('Next'));
  fireEvent.press(screen.getByText('Next'));
  expect(screen.getByText('Player limit reached (8).')).toBeTruthy();
});
