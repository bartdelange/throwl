import type { ReactNode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SignUpTab } from './SignUp';

const mockRegister = jest.fn();
const mockReplace = jest.fn();

jest.mock('../../../feature/AuthContext', () => ({
  useAuthContext: () => ({ register: mockRegister }),
}));

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ replace: mockReplace }),
}));

jest.mock('validator/es/lib/isEmail', () => jest.fn(() => true));

jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: { error: 'red' } }),
}));

jest.mock('@throwl/shared-ui', () => ({
  AppModal: ({
    visible,
    subTitle,
  }: {
    visible?: boolean;
    subTitle?: string;
  }) =>
    visible
      ? require('react').createElement(
          require('react-native').Text,
          null,
          subTitle,
        )
      : null,
  FormInput: ({
    label,
    value,
    onChangeText,
  }: {
    label?: string;
    value?: string;
    onChangeText?: (value: string) => void;
  }) =>
    require('react').createElement(require('react-native').TextInput, {
      accessibilityLabel: label,
      value,
      onChangeText,
    }),
  Loader: () => null,
  LogoButton: ({ label, onPress }: { label?: string; onPress?: () => void }) =>
    require('react').createElement(
      require('react-native').Text,
      { onPress },
      label,
    ),
}));

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({ children }: { children?: ReactNode }) =>
    require('react').createElement(
      require('react-native').View,
      null,
      children,
    ),
}));

describe('SignUpTab', () => {
  beforeEach(() => jest.clearAllMocks());

  it('contains duplicate-email rejection and displays the mapped error', async () => {
    mockRegister.mockRejectedValue({
      code: 'auth/email-already-in-use',
      message: 'The email address is already in use by another account.',
      nativeErrorMessage: '[auth/email-already-in-use]',
    });
    const { getByLabelText, getByText } = render(<SignUpTab />);

    fireEvent.changeText(getByLabelText('EMAIL'), 'existing@example.com');
    fireEvent.changeText(getByLabelText('PASSWORD'), 'new-secret');
    fireEvent.changeText(getByLabelText('CONFIRM PASSWORD'), 'new-secret');
    fireEvent.changeText(getByLabelText('NAME'), 'Existing');
    fireEvent.press(getByText('GO'));

    await waitFor(() =>
      expect(
        getByText('An account already exists for this email address'),
      ).toBeTruthy(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('falls back safely for an unmapped RNFirebase error code', async () => {
    mockRegister.mockRejectedValue({ code: 'auth/new-future-error' });
    const { getByLabelText, getByText } = render(<SignUpTab />);

    fireEvent.changeText(getByLabelText('EMAIL'), 'new@example.com');
    fireEvent.changeText(getByLabelText('PASSWORD'), 'new-secret');
    fireEvent.changeText(getByLabelText('CONFIRM PASSWORD'), 'new-secret');
    fireEvent.changeText(getByLabelText('NAME'), 'New');
    fireEvent.press(getByText('GO'));

    await waitFor(() =>
      expect(
        getByText(
          'An unknown error occurred, please check your credentials and try again',
        ),
      ).toBeTruthy(),
    );
  });
});
