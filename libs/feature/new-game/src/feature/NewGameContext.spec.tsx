import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NewGameProvider, useNewGame } from './NewGameContext';

const Consumer = () => {
  const { state } = useNewGame();
  return (
    <Text>
      {state.mode}:{state.options.mode}:
      {state.options.mode === 'x01' ? state.options.startingScore : 'doubles'}
    </Text>
  );
};

describe('NewGameProvider', () => {
  it('provides the initial game state', () => {
    const { getByText } = render(
      <NewGameProvider
        initialState={{
          mode: 'doubles',
          options: {
            mode: 'doubles',
            quickMatch: false,
            skipBull: false,
            endOnInvalid: false,
          },
          players: [],
        }}
      >
        <Consumer />
      </NewGameProvider>,
    );

    expect(getByText('doubles:doubles:doubles')).toBeTruthy();
  });

  it('fills missing initial state with coherent X01 defaults', () => {
    const { getByText } = render(
      <NewGameProvider initialState={{}}>
        <Consumer />
      </NewGameProvider>,
    );

    expect(getByText('x01:x01:501')).toBeTruthy();
  });

  it('creates matching defaults for a partial selected mode', () => {
    const { getByText } = render(
      <NewGameProvider initialState={{ mode: 'doubles' }}>
        <Consumer />
      </NewGameProvider>,
    );

    expect(getByText('doubles:doubles:doubles')).toBeTruthy();
  });
});
