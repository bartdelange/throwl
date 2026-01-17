import React from 'react';
import { render } from '@testing-library/react-native';

import Firebase from './firebase';

describe('Firebase', () => {
  it('should render successfully', () => {
    const { root } = render(<Firebase />);
    expect(root).toBeTruthy();
  });
});
