import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KarbonText } from '~/components/KarbonText/KarbonText';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';

export const HomeScreen = () => {
  return (
    <FullScreenLayout
      style={{
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <KarbonText>Home</KarbonText>
    </FullScreenLayout>
  );
};

const styles = StyleSheet.create({});
