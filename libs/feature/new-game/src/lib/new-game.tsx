import React from 'react';
import { View, Text } from 'react-native';

/* eslint-disable-next-line */
export interface NewGameProps {}

export function NewGame(props: NewGameProps) {
  return (
    <View>
      <Text>Welcome to new-game!</Text>
    </View>
  );
}

export default NewGame;
