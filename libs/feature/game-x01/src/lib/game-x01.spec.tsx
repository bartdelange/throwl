import { render } from '@testing-library/react-native';

import GameX01 from './game-x01';

describe('GameX01', () => {
  it('should render successfully', () => {
    const { root } = render(<GameX01 />);
    expect(root).toBeTruthy();
  });
});
