import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KarbonText } from '~/components/KarbonText/KarbonText';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';

export const UnauthenticatedScreen = () => {
  return (
    <FullScreenLayout
      style={{
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <KarbonText>Unauthenticated</KarbonText>
    </FullScreenLayout>
  );
};

const styles = StyleSheet.create({});
