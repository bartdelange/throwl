import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { AppLogoDark, AppLogoLight } from '../AppLogo';
import { SharedElement } from 'react-navigation-shared-element';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { makeStyles } from './styles';

interface LogoButtonProps extends PressableProps {
  mode?: 'dark' | 'light';
  label: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
  icon?: string;
}

export const LogoButton: React.FC<LogoButtonProps> = ({
  mode = 'dark',
  label,
  style,
  size = 50,
  icon,
  ...rest
}: LogoButtonProps) => {
  const theme = useTheme();
  const styles = makeStyles();
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        style,
        styles.button,
        {
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      <View style={styles.logo}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            style={{ fontSize: size }}
            color="white"
          />
        ) : mode === 'light' ? (
          <AppLogoDark width={size} />
        ) : (
          <AppLogoLight width={size} />
        )}
      </View>
      <Text
        style={[
          styles.text,
          {
            fontSize: size / 2,
            color: mode === 'light' ? theme.colors.text : 'white',
          },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
};
