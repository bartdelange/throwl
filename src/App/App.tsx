import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNBootSplash from 'react-native-bootsplash';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Preloader } from '~/components/Preloader/Preloader';

import { AuthProvider } from '~/context/AuthContext';
import { Router } from './Router';
import { StyleSheet } from 'react-native';
import { navigationTheme, paperTheme } from './theming';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: paperTheme.colors.background },
  gestureHandlerRootView: { flex: 1 },
});

export default function App() {
  useEffect(() => {
    RNBootSplash.hide({ fade: true });
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <GestureHandlerRootView style={styles.gestureHandlerRootView}>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={navigationTheme}>
            <AuthProvider>
              <Preloader>
                <Router />
              </Preloader>
            </AuthProvider>
          </NavigationContainer>
        </PaperProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
