import { render } from '@testing-library/react-native';

import PlayedGames from './played-games';

describe('PlayedGames', () => {
  it('should render successfully', () => {
    const { root } = render(<PlayedGames />);
    expect(root).toBeTruthy();
  });
});
