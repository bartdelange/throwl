import { render } from '@testing-library/react-native';
import { AppHeader } from './AppHeader';

jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: { onBackground: '#fff' } }),
}));

describe('AppHeader', () => {
  it('renders the provided title', () => {
    const { getByText } = render(<AppHeader title="Main title" />);

    expect(getByText('Main title')).toBeTruthy();
  });
});
