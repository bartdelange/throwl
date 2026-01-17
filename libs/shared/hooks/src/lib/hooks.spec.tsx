import React from 'react';
import { render } from '@testing-library/react-native';

import Hooks from './hooks';

describe('Hooks', () => {
  it('should render successfully', () => {
    const { root } = render(<Hooks />);
    expect(root).toBeTruthy();
  });
});
