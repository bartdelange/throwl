import React, { FC } from 'react';
import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  MaterialDesignIcons,
  MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons';
import { AppLogoDark, AppLogoLight } from '../AppLogo';
import { useAppTheme } from '../../App/theming';

interface LogoButtonProps extends Pick<PressableProps, 'onPress'> {
  mode?: 'dark' | 'light';
  label: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
  icon?: MaterialDesignIconsIconName;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  button: {
    width: 'auto',
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  logo: {
    marginRight: 20,
  },
  text: {
    ...Platform.select({
      default: {
        fontWeight: 'bold',
      },
      android: {
        fontFamily: 'Karbon-Bold',
      },
    }),
    marginTop: 5,
  },
});

export const LogoButton: FC<LogoButtonProps> = ({
  mode = 'dark',
  label,
  style,
  size = 50,
  icon,
  disabled,
  onPress,
}: LogoButtonProps) => {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        style,
        styles.button,
        {
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.logo}>
        {icon ? (
          <MaterialDesignIcons
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
          // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
          {
            fontSize: size / 2,
            color: mode === 'light' ? theme.colors.primary : 'white',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};
