import { render } from '@testing-library/react-native';

import User from './user';

describe('User', () => {
  it('should render successfully', () => {
    const { root } = render(<User />);
    expect(root).toBeTruthy();
  });
});
