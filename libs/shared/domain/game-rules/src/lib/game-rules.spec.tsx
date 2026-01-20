import { render } from '@testing-library/react-native';

import GameRules from './game-rules';

describe('GameRules', () => {
  it('should render successfully', () => {
    const { root } = render(<GameRules />);
    expect(root).toBeTruthy();
  });
});
