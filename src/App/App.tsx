import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import {
  SPLASH_SCREEN,
  HOME_SCREEN,
  UNAUTHENTICATED_SCREEN,
  RootStackParamList,
} from '#/navigation';
import { SplashScreen } from '~/screens/Splash/Splash';
import { UnauthenticatedScreen } from '~/screens/Unauthenticated/Unauthenticated';
import { HomeScreen } from '~/screens/Home/Home';
import { AuthProvider } from '~/context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name={SPLASH_SCREEN} component={SplashScreen} />
          <Stack.Screen
            name={UNAUTHENTICATED_SCREEN}
            component={UnauthenticatedScreen}
          />
          <Stack.Screen name={HOME_SCREEN} component={HomeScreen} />
        </Stack.Navigator>
      </AuthProvider>
    </NavigationContainer>
  );
}
