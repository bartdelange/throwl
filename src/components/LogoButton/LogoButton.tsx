import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppLogoDark, AppLogoLight } from '../AppLogo';
import { makeStyles } from './styles';
import { useAppTheme } from '~/App/theming.tsx';

interface LogoButtonProps extends Pick<PressableProps, 'onPress'> {
  mode?: 'dark' | 'light';
  label: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
  icon?: string;
  disabled?: boolean;
}

export const LogoButton: React.FC<LogoButtonProps> = ({
  mode = 'dark',
  label,
  style,
  size = 50,
  icon,
  disabled,
  onPress,
}: LogoButtonProps) => {
  const theme = useAppTheme();
  const styles = makeStyles();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        style,
        styles.button,
        {
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
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
