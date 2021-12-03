import { RootStackParamList } from '#/navigation';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Dimensions, FlatList, SafeAreaView, View } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppLogoArrowLight } from '~/components/AppLogo';

import { ClickableDartboard } from '~/components/ClickableDartboard/ClickableDartboard';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { ScoreHelper } from '~/lib/score_helper';
import { User } from '~/models/user';
import { makeStyles } from './styles';

export const GameDetailScreen: React.FC<any> = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GAME_DETAIL'>>();
  const game = route.params.game;

  const { colors } = useTheme();
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const styles = makeStyles();
  const scoreTableRef = React.createRef<FlatList>();

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <View style={styles.dartboardWrapper}>
          <ClickableDartboard />
        </View>
        <SafeAreaView style={styles.playerListWrapper}>
          <FlatList<User>
            ref={scoreTableRef}
            data={game.players}
            style={styles.playerList}
            renderItem={({ item: user, index }) => {
              const userScore = ScoreHelper.calculateScoreStatsForUser(
                game.turns.filter(t => t.userId === user.id),
                game.startingScore
              );
              return (
                <View style={styles.playerListRow}>
                  <Text numberOfLines={1} style={styles.playerName}>
                    {user.name}
                  </Text>
                  {userScore.score === 0 ? (
                    <Text style={styles.scoreSegment} numberOfLines={1}>
                      Winner
                    </Text>
                  ) : (
                    <Text style={styles.scoreSegment} numberOfLines={1}>
                      Remaining score: {userScore.score}
                    </Text>
                  )}
                  <MaterialCommunityIcons
                    style={styles.arrowDown}
                    color="white"
                    name="chevron-down-circle-outline"
                  />
                </View>
              );
            }}
          />
        </SafeAreaView>
      </View>
      <View style={[styles.backButton, { top: insets.top }]}>
        <Appbar.BackAction color={colors.primary} onPress={navigator.goBack} />
      </View>
    </FullScreenLayout>
  );
};
