import {
  NEW_GAME_SCREEN,
  NORMAL_GAME_DETAIL_SCREEN,
  RootStackParamList,
} from '@throwl/shared-constants';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { FC, useState } from 'react';
import { Dimensions, FlatList, Pressable, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Accordion } from '../../../components/Accordion';
import { useAppTheme } from '../../../App/theming';
import { ClickableDartboard } from '../../../components/ClickableDartboard/ClickableDartboard';
import { FullScreenLayout } from '../../../layouts/FullScreen/FullScreen';
import { GameHelper } from '../../../lib/game_helper';
import { DoublesOptions, GuestUser, User } from '@throwl/shared-domain-models';
import { GraphContainer } from './components/GraphContainer/GraphContainer';
import { StatsContainer } from './components/StatsContainer/StatsContainer';
import { useStyles } from './styles';
import { GameService } from '../../../services/game_service';
import { DoublesGameHelper } from '../../../lib/doubles_game_helper';

export const DoublesGameDetailScreen: FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [heatmap, setHeatmap] = useState<Map<string, number>>();

  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, typeof NORMAL_GAME_DETAIL_SCREEN>>();
  const game = route.params.game;
  const gameOptions = game.options as DoublesOptions;

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
                selectedUsers: game.players.map((u) =>
                  u.type === 'user' ? u.id : u.name,
                ),
                guestUsers: game.players
                  .filter((u) => u.type === 'guest_user')
                  .map((u) => u.name),
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
              const userTurns = game.turns.filter(
                (t) => t.userId === parsedPlayer.id,
              );
              const userThrows = userTurns
                .flatMap((turn) => turn.throws)
                .filter((thrw) => thrw.score !== 0);
              const throwCount = GameHelper.getThrowCounts(userThrows);
              const turnStats = GameHelper.getPostDoublesGameTurnStats(
                userTurns,
                gameOptions,
              );
              const neededDouble = DoublesGameHelper.getNextDoubleNeeded(
                userTurns,
                parsedPlayer.id,
                gameOptions,
              );

              return (
                <Accordion
                  title={parsedPlayer.name}
                  titleStyle={styles.playerName}
                  subtitle={
                    neededDouble.isComplete
                      ? 'Winner'
                      : `Still needed: ${neededDouble.next && GameHelper.createScoreString(neededDouble.next)}`
                  }
                  subtitleStyle={styles.scoreText}
                  open={selectedUserId === parsedPlayer.id}
                  onChange={() => {
                    setSelectedUserId((current) => {
                      setHeatmap(
                        current === parsedPlayer.id
                          ? undefined
                          : GameHelper.calculateHeatmap(throwCount),
                      );
                      return current === parsedPlayer.id
                        ? undefined
                        : parsedPlayer.id;
                    });
                  }}
                >
                  <View style={styles.accordionContent}>
                    <View style={styles.statsContainer}>
                      <StatsContainer
                        textSize={textSize}
                        turnStats={turnStats}
                      />
                    </View>
                    <View style={styles.graphContainer}>
                      <GraphContainer
                        turns={userTurns}
                        gameOptions={game.options as DoublesOptions}
                      />
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
