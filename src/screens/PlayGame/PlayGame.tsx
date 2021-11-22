import { Appbar, IconButton, Portal, Text, useTheme } from 'react-native-paper';
import {
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/core';
import { Col, Grid, Row } from 'react-native-easy-grid';

import { ClickableDartboard } from '~/components/ClickableDartboard/ClickableDartboard';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '#/navigation';
import { RouteProp } from '@react-navigation/native';
import { makeStyles } from './styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogoArrowLight } from '~/components/AppLogo';
import { Throw } from '~/models/throw';
import { Turn } from '~/models/turn';
import { User } from '~/models/user';
import { ScoreHelper } from '~/lib/score_helper';
import { AppModal } from '~/components/AppModal/AppModal';
import { Swipeable } from '~/components/Swipeable/Swipeable';

export const PlayGameScreen: React.FC<any> = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PLAY_GAME'>>();

  const [gameFinished, setGameFinished] = React.useState<boolean>(false);
  const [droppingOutUserIndex, setDroppingOutUserIndex] =
    React.useState<number>();
  const [activeUserIndex, setActiveUserIndex] = React.useState<number>(0);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = React.useState<Turn>({
    userId: route.params.players[0].id,
    throws: [],
  });
  const { colors } = useTheme();
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const styles = makeStyles();
  const iconSize = Math.max(width * 0.04, 24);
  const scoreTableRef = React.createRef<FlatList>();

  const rotateUsers = (reverse: boolean = false): number => {
    let nextUserIndex = activeUserIndex + (reverse ? -1 : 1);
    if (nextUserIndex >= route.params.players.length) nextUserIndex = 0;
    if (nextUserIndex < 0) nextUserIndex = route.params.players.length - 1;
    scoreTableRef.current?.scrollToIndex({
      animated: true,
      viewPosition: 0.5,
      index: nextUserIndex,
    });
    setActiveUserIndex(nextUserIndex);
    return nextUserIndex;
  };

  const finishTurn = (turn: Turn) => {
    // Set game turns
    setTurns([...turns, turn]);
    // Push next user
    const nextUserIndex = rotateUsers();
    setCurrentTurn({
      userId: route.params.players[nextUserIndex].id,
      throws: [],
    });
  };

  const finishGame = () => {
    setGameFinished(true);
  };

  const updateScoreOnThrow = (
    thrw: Throw,
    position: { x: number; y: number }
  ) => {
    if (gameFinished) return;
    const newTurn = {
      ...currentTurn,
      throws: [...currentTurn.throws, thrw],
    };
    const userScore =
      ScoreHelper.calculateScore(
        turns.filter(t => t.userId === newTurn.userId && t.isValid)
      ) + ScoreHelper.calculateTurnScore(newTurn);
    newTurn.isValid = ScoreHelper.checkThrowValidity(
      newTurn,
      userScore,
      route.params.startingScore
    );
    setCurrentTurn(newTurn);
    if (userScore === route.params.startingScore && newTurn.isValid) {
      return finishGame();
    }
    if (newTurn.throws.length === 3 || !newTurn.isValid) {
      finishTurn(newTurn);
    }
  };

  const undoThrow = () => {
    let newTurn = { ...currentTurn };
    let newTurns = [...turns];
    if (!newTurn.throws.length) {
      const lastTurn = newTurns.pop();
      if (!lastTurn) return;
      newTurn = lastTurn;
      setTurns(newTurns);
      rotateUsers(true);
    }
    newTurn.throws.pop();
    setCurrentTurn(newTurn);
    setGameFinished(false);
  };

  const dropOutUser = (userId: string) => {
    if (route.params.players.length === 1) {
      // Remove game
      return navigator.popToTop();
    }
    const oldUserIndex = route.params.players.findIndex(u => u.id === userId);
    const newUserIndex =
      oldUserIndex === route.params.players.length - 1 ? 0 : oldUserIndex;
    setTurns(turns.filter(t => t.userId !== userId));
    navigator.setParams({
      ...route.params,
      players: route.params.players.filter(u => u.id !== userId),
    });
    setActiveUserIndex(newUserIndex);
    if (oldUserIndex === activeUserIndex) {
      setCurrentTurn({
        userId: route.params.players[newUserIndex].id,
        throws: [],
      });
    }
    setDroppingOutUserIndex(undefined);
  };

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <Pressable
          onPress={evt =>
            updateScoreOnThrow(
              {
                type: 'out',
                score: 0,
              },
              { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY }
            )
          }>
          <View style={styles.dartboardWrapper}>
            <View>
              <ClickableDartboard onClick={updateScoreOnThrow} />
              <Text style={styles.missText}>MISS</Text>
            </View>
          </View>
        </Pressable>
        <SafeAreaView style={styles.scoreWrapper}>
          <View style={styles.currentTurnScoreContainer}>
            <View style={styles.currentThrowContainer}>
              <Text style={styles.currentThrowNumberText}>1</Text>
              <Text style={styles.currentThrowNumberTextSuperScript}>st</Text>
              <Text style={styles.currentThrowScoreText}>
                {ScoreHelper.createScoreString(currentTurn.throws[0])}
              </Text>
            </View>
            <View style={styles.currentThrowContainer}>
              <Text style={styles.currentThrowNumberText}>2</Text>
              <Text style={styles.currentThrowNumberTextSuperScript}>nd</Text>
              <Text style={styles.currentThrowScoreText}>
                {ScoreHelper.createScoreString(currentTurn.throws[1])}
              </Text>
            </View>
            <View style={styles.currentThrowContainer}>
              <Text style={styles.currentThrowNumberText}>3</Text>
              <Text style={styles.currentThrowNumberTextSuperScript}>rd</Text>
              <Text style={styles.currentThrowScoreText}>
                {ScoreHelper.createScoreString(currentTurn.throws[2])}
              </Text>
            </View>
            <IconButton
              icon="restore"
              size={iconSize}
              color={colors.primary}
              onPress={undoThrow}
              rippleColor="rgba(255, 255, 255, .95)"
              style={[
                styles.undoButton,
                {
                  paddingRight: iconSize * 0.067,
                },
              ]}
            />
          </View>
          <Grid style={styles.scoreTable}>
            <Row style={styles.scoreTableHead}>
              <Col style={styles.scoreTableCol} size={3}>
                <Text
                  style={[styles.scoreTableCell, styles.scoreTableBoldCell]}>
                  Name
                </Text>
              </Col>
              <Col style={styles.scoreTableCol} size={1}>
                <Text
                  style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
                  Last
                </Text>
              </Col>
              <Col style={styles.scoreTableCol} size={1}>
                <Text
                  style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
                  Avg
                </Text>
              </Col>
              <Col style={styles.scoreTableCol} size={1.5}>
                <Text
                  style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
                  Valid Avg
                </Text>
              </Col>
              <Col style={styles.scoreTableCol} size={1}>
                <Text
                  style={[
                    styles.scoreTableCell,
                    styles.scoreTableBoldCell,
                    styles.scoreTableCenterCell,
                  ]}>
                  Score
                </Text>
              </Col>
            </Row>
            <FlatList<User>
              ref={scoreTableRef}
              data={route.params.players}
              style={{
                width: '95%',
              }}
              renderItem={({ item: user, index }) => {
                const userScore = ScoreHelper.calculateScoreStatsForUser(
                  turns.filter(t => t.userId === user.id),
                  route.params.startingScore,
                  activeUserIndex === index ? currentTurn : undefined
                );
                return (
                  <Swipeable
                    key={user.id}
                    rightActions={[
                      {
                        icon: 'delete',
                        onPress: () => setDroppingOutUserIndex(index),
                      },
                    ]}>
                    <Row style={styles.scoreTableRow}>
                      {activeUserIndex === index && (
                        <View style={styles.activeUserIcon}>
                          <AppLogoArrowLight width={width * 0.02} />
                        </View>
                      )}
                      <Col style={styles.scoreTableCol} size={3}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.scoreTableCell,
                            styles.scoreTableBoldCell,
                          ]}>
                          {user.name}
                        </Text>
                      </Col>
                      <Col style={styles.scoreTableCol} size={1}>
                        <Text
                          style={[
                            styles.scoreTableCell,
                            styles.scoreTableCenterCell,
                          ]}>
                          {userScore.last}
                        </Text>
                      </Col>
                      <Col style={styles.scoreTableCol} size={1}>
                        <Text
                          style={[
                            styles.scoreTableCell,
                            styles.scoreTableCenterCell,
                          ]}>
                          {userScore.avg}
                        </Text>
                      </Col>
                      <Col style={styles.scoreTableCol} size={1.5}>
                        <Text
                          style={[
                            styles.scoreTableCell,
                            styles.scoreTableCenterCell,
                          ]}>
                          {userScore.validAvg}
                        </Text>
                      </Col>
                      <Col style={styles.scoreTableCol} size={1}>
                        <Text
                          style={[
                            styles.scoreTableCell,
                            styles.scoreTableBoldCell,
                            styles.scoreTableCenterCell,
                          ]}>
                          {userScore.score}
                        </Text>
                      </Col>
                    </Row>
                  </Swipeable>
                );
              }}
            />
          </Grid>
        </SafeAreaView>
      </View>
      <Portal>
        <AppModal
          title="WINNER"
          titleIcon="crown"
          subTitle={route.params.players[activeUserIndex].name}
          visible={gameFinished}
          actions={
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon="logout-variant"
                size={iconSize * 1.5}
                color={colors.primary}
                onPress={navigator.popToTop}
              />
              <IconButton
                icon="chart-line"
                size={iconSize * 1.5}
                color={colors.success}
                onPress={() => null}
              />
              <IconButton
                icon="restore"
                size={iconSize * 1.5}
                color={colors.error}
                onPress={undoThrow}
                style={[
                  styles.undoButton,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
              />
            </View>
          }
        />
      </Portal>
      <Portal>
        <AppModal
          title="ARE YOU SURE?"
          titleColor={colors.primary}
          subTitle={`Are you sure you wish to drop out${
            droppingOutUserIndex != null
              ? ` ${
                  route.params.players[droppingOutUserIndex].name.split(' ')[0]
                }`
              : ''
          }?`}
          visible={droppingOutUserIndex != null}
          actions={
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon="check"
                size={iconSize * 1.5}
                color={colors.error}
                onPress={() =>
                  droppingOutUserIndex != null
                    ? dropOutUser(route.params.players[droppingOutUserIndex].id)
                    : null
                }
              />
              <IconButton
                icon="close"
                size={iconSize * 1.5}
                color={colors.success}
                onPress={() => setDroppingOutUserIndex(undefined)}
              />
            </View>
          }
        />
      </Portal>
      <View style={[styles.backButton, { top: insets.top }]}>
        <Appbar.BackAction color={colors.primary} onPress={navigator.goBack} />
      </View>
    </FullScreenLayout>
  );
};
