import React, { FC, RefObject } from 'react';
import { Text } from 'react-native-paper';
import { Col, Grid, Row } from 'react-native-easy-grid';
import { useStyles } from './ScoreTable.styles.tsx';
import { GuestUser, User } from '~/models/user.ts';
import { FlatList, View } from 'react-native';
import { GameService } from '~/services/game_service.ts';
import { GameHelper } from '~/lib/game_helper.ts';
import { Turn } from '~/models/turn.ts';
import { AppLogoArrowLight } from '~/components/AppLogo';
import { SwipeActions } from '~/components/Swipeable/SwipeActions.tsx';

interface ScoreTableProps {
  scoreTableRef: RefObject<FlatList<User | GuestUser> | null>;
  turns: Turn[];
  players: (User | GuestUser)[];
  startingScore: number;
  activeUserIndex: number;
  currentTurn: Turn;
  width: number;
  setDroppingOutUserIndex: (index: number) => void;
}

export const ScoreTable: FC<ScoreTableProps> = ({
  scoreTableRef,
  turns,
  players,
  startingScore,
  activeUserIndex,
  currentTurn,
  width,
  setDroppingOutUserIndex,
}) => {
  const styles = useStyles();

  return (
    <Grid style={styles.scoreTable}>
      <Row style={styles.scoreTableHead}>
        <Col style={styles.scoreTableCol} size={2}>
          <Text style={[styles.scoreTableCell, styles.scoreTableBoldCell]}>Name</Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>Darts</Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>Last</Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>Avg</Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1.5}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>Valid Avg</Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text
            style={[styles.scoreTableCell, styles.scoreTableBoldCell, styles.scoreTableCenterCell]}
          >
            Score
          </Text>
        </Col>
      </Row>
      <FlatList<User | GuestUser>
        onScrollToIndexFailed={() => {}}
        ref={scoreTableRef}
        data={players}
        style={styles.scoreTablePlayerList}
        renderItem={({ item: user, index }) => {
          const parsedUser = GameService.stubPlayer(user);
          const userScore = GameHelper.calculateInNormalGameScoreStatsForUser(
            turns.filter(t => t.userId === parsedUser.id),
            startingScore,
            activeUserIndex === index ? currentTurn : undefined,
          );
          return (
            <SwipeActions
              bounce={index === 0}
              key={parsedUser.id}
              rightActions={[
                {
                  icon: 'delete',
                  onPress: () => setDroppingOutUserIndex(index),
                },
              ]}
            >
              <Row style={styles.scoreTableRow}>
                {activeUserIndex === index && (
                  <View style={styles.activeUserIcon}>
                    <AppLogoArrowLight width={width * 0.02} />
                  </View>
                )}
                <Col style={styles.scoreTableCol} size={2}>
                  <Text
                    numberOfLines={1}
                    style={[styles.scoreTableCell, styles.scoreTableBoldCell]}
                  >
                    {parsedUser.name}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1}>
                  <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
                    {userScore.throws}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1}>
                  <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
                    {userScore.last}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1}>
                  <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
                    {userScore.avg}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1.5}>
                  <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
                    {userScore.validAvg}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1}>
                  <Text
                    style={[
                      styles.scoreTableCell,
                      styles.scoreTableBoldCell,
                      styles.scoreTableCenterCell,
                    ]}
                  >
                    {userScore.score}
                  </Text>
                </Col>
              </Row>
            </SwipeActions>
          );
        }}
      />
    </Grid>
  );
};
