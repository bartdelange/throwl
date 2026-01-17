import React from 'react';
import { render } from '@testing-library/react-native';

import Game from './game';

describe('Game', () => {
  it('should render successfully', () => {
    const { root } = render(<Game />);
    expect(root).toBeTruthy();
  });
});
