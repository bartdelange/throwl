import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

export const KarbonText = (props: PropsWithChildren<TextProps>) => (
  <Text {...props} style={[props.style, styles.text]} />
);

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Karbon-Regular',
  },
});
