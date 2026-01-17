import React from 'react';
import { render } from '@testing-library/react-native';

import NewGame from './new-game';

describe('NewGame', () => {
  it('should render successfully', () => {
    const { root } = render(<NewGame />);
    expect(root).toBeTruthy();
  });
});
