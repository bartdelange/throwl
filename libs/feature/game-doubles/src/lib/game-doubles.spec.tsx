import React from 'react';
import { render } from '@testing-library/react-native';

import GameDoubles from './game-doubles';

describe('GameDoubles', () => {
  it('should render successfully', () => {
    const { root } = render(<GameDoubles />);
    expect(root).toBeTruthy();
  });
});
