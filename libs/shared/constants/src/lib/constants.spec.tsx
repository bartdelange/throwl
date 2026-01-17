import React from 'react';
import { render } from '@testing-library/react-native';

import Constants from './constants';

describe('Constants', () => {
  it('should render successfully', () => {
    const { root } = render(<Constants />);
    expect(root).toBeTruthy();
  });
});
