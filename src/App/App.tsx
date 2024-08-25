import {
  DarkTheme as NavigationDarkTheme,
  NavigationContainer,
} from '@react-navigation/native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNBootSplash from 'react-native-bootsplash';
import {
  configureFonts,
  MD3DarkTheme as PaperDarkTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Preloader } from '~/components/Preloader/Preloader';

import { AuthProvider } from '~/context/AuthContext';
import { Router } from './Router';
import { LogBox } from 'react-native';

declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      error: string;
      success: string;
      warning: string;
    }
  }
}

const fonts = {
  regular: {
    fontFamily: 'Karbon-Regular',
    fontWeight: 'normal',
  },
  medium: {
    fontFamily: 'Karbon-Medium',
    fontWeight: 'normal',
  },
  light: {
    fontFamily: 'Karbon-Regular',
    fontWeight: 'normal',
  },
  thin: {
    fontFamily: 'Karbon-Regular',
    fontWeight: 'normal',
  },
};
const fontConfig = {
  ios: fonts,
  android: fonts,
  macos: fonts,
  windows: fonts,
  web: fonts,
  native: fonts,
};
export const theme = {
  ...NavigationDarkTheme,
  ...PaperDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...PaperDarkTheme.colors,
    primary: '#02314e',
    accent: '#adcadb',
    background: '#02314e',
    card: '#02314e',
    surface: '#02314e',
    error: '#f20500',
    success: '#008000',
    warning: '#c0c000',
  },
  fonts: configureFonts(fontConfig as any),
};

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  React.useEffect(() => {
    RNBootSplash.hide({ fade: true });
  }, []);

  return (
    <SafeAreaProvider
      style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={theme}>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <Preloader>
                <Router />
              </Preloader>
            </AuthProvider>
          </PaperProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
