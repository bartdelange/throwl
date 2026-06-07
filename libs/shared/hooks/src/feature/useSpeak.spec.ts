import { renderHook, act } from '@testing-library/react-native';
import Tts from 'react-native-tts';
import { useSpeak } from './useSpeak';

jest.mock('react-native-tts', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  setDefaultLanguage: jest.fn(() => Promise.resolve()),
  speak: jest.fn(),
}));

describe('useSpeak', () => {
  it('sets language and speaks the requested words', async () => {
    const { result } = renderHook(() =>
      useSpeak({ language: 'nl-NL', rate: 0.7 }),
    );

    await act(async () => {
      await result.current('Game on');
    });

    expect(Tts.setDefaultLanguage).toHaveBeenCalledWith('nl-NL');
    expect(Tts.speak).toHaveBeenCalledWith('Game on', { rate: 0.7 });
  });
});
