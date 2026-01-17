import React from 'react';
import { render } from '@testing-library/react-native';

import Home from './home';

describe('Home', () => {
  it('should render successfully', () => {
    const { root } = render(<Home />);
    expect(root).toBeTruthy();
  });
});
