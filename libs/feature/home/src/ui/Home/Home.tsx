import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Dimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppLogoLight, LogoButton } from '@throwl/shared-ui';
import {
  NEW_GAME_SCREEN,
  PLAYED_GAMES_SCREEN,
  RootStackParamList,
} from '@throwl/shared-constants';
import { useAuthContext } from '@throwl/feature-auth';
import { FullScreenLayout } from '@throwl/shared-layouts';
import { useStyles } from './styles';

export const HomeScreen = () => {
  const { user } = useAuthContext();
  const { width } = Dimensions.get('window');
  const styles = useStyles();
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <FullScreenLayout style={styles.layout}>
      <View style={styles.logo}>
        <AppLogoLight />
      </View>
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        adjustsFontSizeToFit={true}
        style={styles.userWelcome}
      >
        Hi {user?.name}!
      </Text>
      <View style={styles.homeContent}>
        <LogoButton
          label="NEW GAME"
          icon="plus"
          size={Math.min(width * 0.1, 100)}
          style={styles.buttons}
          onPress={() => navigator.push(NEW_GAME_SCREEN, { selectedUsers: [] })}
        />
        <LogoButton
          label="PLAYED GAMES"
          icon="history"
          size={Math.min(width * 0.1, 100)}
          style={styles.buttons}
          onPress={() => navigator.push(PLAYED_GAMES_SCREEN)}
        />
      </View>
    </FullScreenLayout>
  );
};
