import { render } from '@testing-library/react-native';

import App from './App';

describe(App.name, () => {
  it('should render successfully', () => {
    const { root } = render(<App />);
    expect(root).toBeTruthy();
  });
});
