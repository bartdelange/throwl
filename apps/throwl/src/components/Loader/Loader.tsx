import React, { FC } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Portal } from 'react-native-paper';
import { useStyles } from './Loader.styles';

export const Loader: FC<{ working: boolean }> = ({ working }) => {
  const styles = useStyles();

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
