jest.mock('@react-navigation/native', () => ({
  DarkTheme: {
    dark: true,
    colors: {
      primary: 'mock-primary',
      background: 'mock-background',
      card: 'mock-card',
      text: 'mock-text',
      border: 'mock-border',
      notification: 'mock-notification',
    },
    fonts: {},
  },
}));

import { navigationTheme, paperTheme } from './theme';

describe('theme', () => {
  it('exports configured paper and navigation themes', () => {
    expect(paperTheme.colors.primary).toBe('#02314e');
    expect(paperTheme.colors.success).toBe('#008000');
    expect(navigationTheme.colors.background).toBe('#02314e');
  });
});
