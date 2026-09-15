import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { NewGameProvider } from '../../../feature/NewGameContext';
import { GameModeScreen } from '../GameMode/GameMode';
import { GameOptionsScreen } from './GameOptions';

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ push: jest.fn() }),
}));

jest.mock('../NewGame', () => ({
  GameFlowStackNames: {
    GAME_MODE: 'GameMode',
    GAME_OPTIONS: 'GameOptions',
    PLAYER_SELECT: 'PlayerSelect',
  },
}));

jest.mock('@throwl/shared-ui', () => {
  const { Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AppHeader: ({ title }: { title: string }) => <Text>{title}</Text>,
    LogoButton: ({ label }: { label: string }) => <Text>{label}</Text>,
  };
});

jest.mock('../NewGameScreenLayout', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    NewGameScreenLayout: ({ children }: { children: ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('../GameMode/components/ModeAccordion', () => {
  const { Pressable, Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ModeAccordion: ({
      title,
      setOpen,
    }: {
      title: string;
      setOpen: () => void;
    }) => (
      <Pressable onPress={setOpen}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

jest.mock('./components/X01Options/X01Options', () => {
  const { Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    X01OptionsView: ({ options }: { options: { startingScore: number } }) => (
      <Text>X01 score: {options.startingScore}</Text>
    ),
  };
});

jest.mock('./components/DoublesOptions/DoublesOptions', () => {
  const { Text } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return { DoublesOptionsView: () => <Text>Doubles options</Text> };
});

describe('GameOptionsScreen', () => {
  it('renders X01 defaults without requiring a game-mode interaction', () => {
    const { getByText } = render(
      <NewGameProvider initialState={{}}>
        <GameOptionsScreen />
      </NewGameProvider>,
    );

    expect(getByText('X01 score: 501')).toBeTruthy();
  });

  it('keeps selected mode and rendered options synchronized', () => {
    const { getByText, queryByText } = render(
      <NewGameProvider initialState={{}}>
        <GameModeScreen />
        <GameOptionsScreen />
      </NewGameProvider>,
    );

    expect(getByText('X01 score: 501')).toBeTruthy();

    fireEvent.press(getByText('Doubles'));
    expect(getByText('Doubles options')).toBeTruthy();
    expect(queryByText('X01 score: 501')).toBeNull();

    fireEvent.press(getByText('Normal'));
    expect(getByText('X01 score: 501')).toBeTruthy();
    expect(queryByText('Doubles options')).toBeNull();
  });
});
