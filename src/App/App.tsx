import React from 'react';
import {
  DarkTheme as NavigationDarkTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { Linking, Platform } from 'react-native';
import {
  configureFonts,
  DarkTheme as PaperDarkTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider } from '~/context/AuthContext';
import { Router } from './Router';
import { Preloader } from '~/components/Preloader/Preloader';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
    fontWeight: '300',
  },
  thin: {
    fontFamily: 'Karbon-Regular',
    fontWeight: '100',
  },
};
const fontConfig = {
  web: fonts,
  ios: fonts,
  android: fonts,
};
const theme = {
  ...NavigationDarkTheme,
  ...PaperDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...PaperDarkTheme.colors,
    primary: '#02314e',
    background: '#02314e',
    card: '#02314e',
    surface: '#02314e',
    error: '#f20500',
    success: '#008000',
    warning: '#c0c000',
  },
  fonts: configureFonts(fontConfig as any),
};

const PERSISTENCE_KEY = 'NAVIGATION_STATE';
export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (Platform.OS !== 'web' && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider
      style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer
          theme={theme}
          initialState={initialState}
          onStateChange={state => {
            if (JSON.stringify(state)) {
              AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
            }
          }}>
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
