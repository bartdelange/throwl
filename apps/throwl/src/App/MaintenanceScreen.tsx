import type { PropsWithChildren } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@throwl/shared-theme';
import { AppLogoLight } from '@throwl/shared-ui';

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    position: 'absolute',
  },
  text: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});

export const MaintenanceScreen = () => {
  const { width, height } = useWindowDimensions();
  const { colors } = useAppTheme();
  const logoSize = width * 0.45;
  const logoTop = height / 2 - logoSize / 2;

  return (
    <View style={[styles.layout, { backgroundColor: colors.background }]}>
      <View style={[styles.logo, { top: logoTop }]}>
        <AppLogoLight width={logoSize} />
      </View>
      <View style={[styles.text, { top: height / 2 + logoSize / 2 + 24 }]}>
        <Text
          accessibilityRole="header"
          variant="headlineSmall"
          style={[styles.title, { color: colors.onBackground }]}
        >
          We&apos;ll be right back
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.message, { color: colors.onBackground }]}
        >
          We are currently performing some maintenance.{`\n`}Please try again
          shortly.
        </Text>
      </View>
    </View>
  );
};

export const MaintenanceGate = ({
  enabled,
  children,
}: PropsWithChildren<{ enabled: boolean | null }>) => {
  if (enabled === null) {
    return null;
  }

  return enabled ? <MaintenanceScreen /> : children;
};
