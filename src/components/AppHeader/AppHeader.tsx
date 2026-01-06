import { Divider, Text } from 'react-native-paper';
import React, { FC, JSX } from 'react';
import { View } from 'react-native';
import { useStyles } from '~/components/AppHeader/AppHeader.styles.ts';

export const AppHeader: FC<{ title: string; right?: JSX.Element }> = ({ title, right }) => {
  const styles = useStyles();
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.heading}>{title}</Text>
        <View style={styles.right}>
          <View style={styles.rightInner}>{right}</View>
        </View>
      </View>
      <Divider style={styles.divider} />
    </>
  );
};
