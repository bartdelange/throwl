import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NewGameProvider, useNewGame } from './NewGameContext';

const Consumer = () => {
  const { state } = useNewGame();
  return <Text>{state.mode}</Text>;
};

describe('NewGameProvider', () => {
  it('provides the initial game state', () => {
    const { getByText } = render(
      <NewGameProvider
        initialState={{
          mode: 'doubles',
          options: { mode: 'doubles', quickMatch: false, skipBull: false },
          players: [],
        }}
      >
        <Consumer />
      </NewGameProvider>,
    );

    expect(getByText('doubles')).toBeTruthy();
  });
});
