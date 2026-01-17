import React from 'react';
import { render } from '@testing-library/react-native';

import Friends from './friends';

describe('Friends', () => {
  it('should render successfully', () => {
    const { root } = render(<Friends />);
    expect(root).toBeTruthy();
  });
});
