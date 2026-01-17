import React from 'react';
import { View, Text } from 'react-native';

/* eslint-disable-next-line */
export interface UserProps {}

export function User(props: UserProps) {
  return (
    <View>
      <Text>Welcome to user!</Text>
    </View>
  );
}

export default User;
