import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FullScreenLayout } from './FullScreen';

jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: { background: '#000', secondary: '#fff' } }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props) => props.children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('FullScreenLayout', () => {
  it('renders children in the layout', () => {
    const { getByText } = render(
      <FullScreenLayout size="fullscreen">
        <Text>Layout content</Text>
      </FullScreenLayout>,
    );

    expect(getByText('Layout content')).toBeTruthy();
  });
});
