import { NEW_GAME_SCREEN, NORMAL_GAME_DETAIL_SCREEN, RootStackParamList } from '#/navigation.ts';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { FC, useState } from 'react';
import { Dimensions, FlatList, Pressable, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Accordion } from '~/components/Accordion';
import { useAppTheme } from '~/App/theming.tsx';
import { ClickableDartboard } from '~/components/ClickableDartboard/ClickableDartboard.tsx';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen.tsx';
import { GameHelper } from '~/lib/game_helper.ts';
import { GuestUser, User } from '~/models/user.ts';
import { GraphContainer } from '~/screens/NormalMatch/NormalGameDetail/components/GraphContainer/GraphContainer.tsx';
import { StatsContainer } from '~/screens/NormalMatch/NormalGameDetail/components/StatsContainer/StatsContainer.tsx';
import { useStyles } from './styles.ts';
import { GameService } from '~/services/game_service.ts';
import { X01Options } from '~/models/game.ts';

export const NormalGameDetailScreen: FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [heatmap, setHeatmap] = useState<Map<string, number>>();

  const navigator = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof NORMAL_GAME_DETAIL_SCREEN>>();
  const game = route.params.game;
  const gameOptions = game.options as X01Options;

  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const textSize = Math.max(Dimensions.get('window').width * 0.04, 20);
  const styles = useStyles(textSize);

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <View style={styles.dartboardWrapper}>
          <Pressable
            onPress={() =>
              navigator.push(NEW_GAME_SCREEN, {
                selectedUsers: game.players.map(u => (u.type === 'user' ? u.id : u.name)),
                guestUsers: game.players.filter(u => u.type === 'guest_user').map(u => u.name),
                gameOptions: game.options,
              })
            }
          >
            <View style={styles.dartboard}>
              <ClickableDartboard heatmap={heatmap} />
            </View>
            <Text style={styles.missText}>REMATCH?</Text>
          </Pressable>
        </View>
        <SafeAreaView style={styles.playerListWrapper}>
          <FlatList<User | GuestUser>
            alwaysBounceVertical={false}
            data={game.players}
            style={styles.playerList}
            renderItem={({ item }) => {
              const parsedPlayer = GameService.stubPlayer(item);
              const userTurns = game.turns.filter(t => t.userId === parsedPlayer.id);
              const userThrows = userTurns
                .filter(turn => turn.isValid)
                .flatMap(turn => turn.throws)
                .filter(thrw => thrw.score !== 0);
              const throwCount = GameHelper.getThrowCounts(userThrows);
              const userScore = GameHelper.calculateNormalGameScoreStatsForUser(
                userTurns,
                gameOptions.startingScore,
              );
              const turnStats = GameHelper.getNormalGameTurnStats(
                userTurns,
                gameOptions.startingScore,
              );
              const throwStats = GameHelper.getThrowStats(userTurns);
              const lastThrown =
                userTurns[userTurns.length - 1].throws[
                  userTurns[userTurns.length - 1].throws.length - 1
                ];

              return (
                <Accordion
                  title={parsedPlayer.name}
                  titleStyle={styles.playerName}
                  subtitle={
                    userScore.score === 0 ? 'Winner' : `Remaining score: ${userScore.score}`
                  }
                  subtitleStyle={styles.scoreText}
                  open={selectedUserId === parsedPlayer.id}
                  onChange={() => {
                    setSelectedUserId(current => {
                      setHeatmap(
                        current === parsedPlayer.id
                          ? undefined
                          : GameHelper.calculateHeatmap(throwCount),
                      );
                      return current === parsedPlayer.id ? undefined : parsedPlayer.id;
                    });
                  }}
                >
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
