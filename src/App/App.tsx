import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNBootSplash from 'react-native-bootsplash';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Preloader } from '~/components/Preloader/Preloader';

import { AuthProvider } from '~/context/AuthContext';
import { Router } from './Router';
import { LogBox } from 'react-native';
import { navigationTheme, paperTheme } from './theming';

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
]);
export default function App() {
    React.useEffect(() => {
        RNBootSplash.hide({ fade: true });
    }, []);

    return (
        <SafeAreaProvider
            style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
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
