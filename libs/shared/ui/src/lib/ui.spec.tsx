import { render } from '@testing-library/react-native';

import Ui from './ui';

describe('Ui', () => {
  it('should render successfully', () => {
    const { root } = render(<Ui />);
    expect(root).toBeTruthy();
  });
});
