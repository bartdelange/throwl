import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNBootSplash from 'react-native-bootsplash';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Preloader } from '@throwl/shared-ui';

import { AuthProvider, useAuthContext } from '@throwl/feature-auth';
import { Router } from './Router';
import { StyleSheet } from 'react-native';
import { navigationTheme, paperTheme } from '@throwl/shared-theme';
import { MaintenanceGate } from './MaintenanceScreen';
import { initializeMaintenanceMode } from './maintenanceMode';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: paperTheme.colors.background },
  gestureHandlerRootView: { flex: 1 },
});

const AppContent = () => {
  const { initializing } = useAuthContext();

  return (
    <Preloader initializing={initializing}>
      <Router />
    </Preloader>
  );
};

export default function App() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    void initializeMaintenanceMode((enabled) => {
      if (!disposed) {
        setMaintenanceMode(enabled);
      }
    }).then((stopListening) => {
      if (disposed) {
        stopListening();
      } else {
        unsubscribe = stopListening;
      }
    });

    void RNBootSplash.hide({ fade: true });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <GestureHandlerRootView style={styles.gestureHandlerRootView}>
        <PaperProvider theme={paperTheme}>
          <MaintenanceGate enabled={maintenanceMode}>
            <NavigationContainer theme={navigationTheme}>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </NavigationContainer>
          </MaintenanceGate>
        </PaperProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
