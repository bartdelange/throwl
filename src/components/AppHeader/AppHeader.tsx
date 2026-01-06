import { Divider, Text } from 'react-native-paper';
import React, { FC, JSX } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const textSize = Math.max(width * 0.04, 24);
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10%',
  },
  heading: {
    fontSize: textSize,
    flex: 1,
    paddingRight: '25%',
    includeFontPadding: false,
    ...Platform.select({
      default: {
        fontWeight: 'bold',
      },
      android: {
        fontFamily: 'Karbon-Bold',
      },
    }),
  },
  divider: {
    height: 3,
    backgroundColor: 'white',
    marginBottom: '10%',
  },
  right: {
    alignSelf: 'flex-end',
    height: '100%',
    width: '25%',
    // paddingBottom: 5,
  },
  rightInner: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: '-50%' }],
  },
});

export const AppHeader: FC<{ title: string; right?: JSX.Element }> = ({ title, right }) => {
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
