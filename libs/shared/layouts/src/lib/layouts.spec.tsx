import { render } from '@testing-library/react-native';

import Layouts from './layouts';

describe('Layouts', () => {
  it('should render successfully', () => {
    const { root } = render(<Layouts />);
    expect(root).toBeTruthy();
  });
});
