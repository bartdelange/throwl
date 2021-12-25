import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal } from 'react-native-paper';

export const Loader: React.FC<{ working: boolean }> = ({ working }) => {
  const styles = StyleSheet.create({
    loader: {
      position: 'absolute',
      left:
        Dimensions.get('screen').width / 2 -
        Dimensions.get('screen').width * 0.1,
      top:
        Dimensions.get('screen').height / 2 -
        Dimensions.get('screen').width * 0.1,
      width: Dimensions.get('screen').width * 0.2,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      borderRadius: Dimensions.get('window').width * 0.05,
      backgroundColor: 'rgba(0,0,0,.25)',
    },
  });

  return working ? (
    <Portal>
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="white" />
      </View>
    </Portal>
  ) : (
    <View />
  );
};
