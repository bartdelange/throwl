import { NEW_GAME_SCREEN, RootStackParamList } from '#/navigation';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  View,
} from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Accordion } from '~/components/Accordion';
import { useAppTheme } from '~/App/theming.tsx';
import { ClickableDartboard } from '~/components/ClickableDartboard/ClickableDartboard';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { ScoreHelper } from '~/lib/score_helper';
import { User } from '~/models/user';
import { GraphContainer } from '~/screens/GameDetail/components/GraphContainer/GraphContainer';
import { StatsContainer } from '~/screens/GameDetail/components/StatsContainer/StatsContainer';
import { makeStyles } from './styles';

export const GameDetailScreen: React.FC<any> = () => {
  const [selectedUserId, setSelectedUserId] = React.useState<string>();
  const [heatmap, setHeatmap] = React.useState<Map<string, number>>();

  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GAME_DETAIL'>>();
  const game = route.params.game;

  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const textSize = Math.max(Dimensions.get('window').width * 0.04, 24);
  const styles = makeStyles(textSize);

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <View style={styles.dartboardWrapper}>
          <Pressable
            onPress={() =>
              navigator.push(NEW_GAME_SCREEN, {
                selectedUsers: game.players.map(u => u.id),
              })
            }>
            <View style={styles.dartboard}>
              <ClickableDartboard heatmap={heatmap} />
            </View>
            <Text style={styles.missText}>REMATCH?</Text>
          </Pressable>
        </View>
        <SafeAreaView style={styles.playerListWrapper}>
          <FlatList<User>
            alwaysBounceVertical={false}
            data={game.players}
            style={styles.playerList}
            renderItem={({ item: user }) => {
              const userTurns = game.turns.filter(t => t.userId === user.id);
              const userThrows = userTurns
                .filter(turn => turn.isValid)
                .flatMap(turn => turn.throws)
                .filter(thrw => thrw.score !== 0);
              const throwCount = ScoreHelper.getThrowCounts(userThrows);
              const userScore = ScoreHelper.calculateScoreStatsForUser(
                userTurns,
                game.startingScore
              );
              const turnStats = ScoreHelper.getTurnStats(
                userTurns,
                game.startingScore
              );
              const throwStats = ScoreHelper.getThrowStats(userTurns);
              const lastThrown =
                userTurns[userTurns.length - 1].throws[
                  userTurns[userTurns.length - 1].throws.length - 1
                ];

              return (
                <Accordion
                  title={user.name}
                  titleStyle={styles.playerName}
                  subtitle={
                    userScore.score === 0
                      ? 'Winner'
                      : `Remaining score: ${userScore.score}`
                  }
                  subtitleStyle={styles.scoreText}
                  open={selectedUserId === user.id}
                  onChange={() => {
                    setSelectedUserId(current => {
                      setHeatmap(
                        current === user.id
                          ? undefined
                          : ScoreHelper.calculateHeatmap(throwCount)
                      );
                      return current === user.id ? undefined : user.id;
                    });
                  }}>
                  <View style={styles.accordionContent}>
                    <View style={styles.statsContainer}>
                      <StatsContainer
                        textSize={textSize}
                        turnStats={turnStats}
                        throwStats={throwStats}
                        lastThrown={lastThrown}
                        mostThrown={throwCount[0][1]}
                        userScore={userScore.score}
                      />
                    </View>
                    <View style={styles.graphContainer}>
                      <GraphContainer turns={userTurns} />
                    </View>
                  </View>
                </Accordion>
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
