import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { paperTheme } from '@throwl/shared-theme';
import { MaintenanceGate } from './MaintenanceScreen';

jest.mock('@throwl/shared-ui', () => {
  const { Text: MockText } = jest.requireActual('react-native');

  return {
    AppLogoLight: () => (
      <MockText testID="home-screen-logo">Home screen logo</MockText>
    ),
  };
});

describe('MaintenanceGate', () => {
  it('blocks the normal application while maintenance mode is active', () => {
    const { queryByText, getByText } = render(
      <PaperProvider theme={paperTheme}>
        <MaintenanceGate enabled>
          <Text>Normal application</Text>
        </MaintenanceGate>
      </PaperProvider>,
    );

    expect(getByText("We'll be right back")).toBeTruthy();
    expect(getByText('Home screen logo')).toBeTruthy();
    expect(
      getByText(
        'We are currently performing some maintenance.\nPlease try again shortly.',
      ),
    ).toBeTruthy();
    expect(queryByText('Normal application')).toBeNull();
  });
});
