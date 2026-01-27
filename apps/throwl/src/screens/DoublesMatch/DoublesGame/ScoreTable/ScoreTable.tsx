import React, { FC, RefObject } from 'react';
import { Text } from 'react-native-paper';
import { Col, Grid, Row } from 'react-native-easy-grid';
import { useStyles } from './ScoreTable.styles';
import {
  DoublesOptions,
  GuestUser,
  Turn,
  User,
} from '@throwl/shared-domain-models';
import { FlatList, View } from 'react-native';
import { GameService } from '@throwl/shared-data-access';
import { GameHelper } from '../../../../lib/game_helper';
import { AppLogoArrowLight } from '../../../../components/AppLogo';
import { SwipeActions } from '../../../../components/Swipeable/SwipeActions';

interface ScoreTableProps {
  scoreTableRef: RefObject<FlatList<User | GuestUser> | null>;
  gameOptions: DoublesOptions;
  players: (User | GuestUser)[];
  turns: Turn[];
  activeUserIndex: number;
  currentTurn: Turn;
  width: number;
  setDroppingOutUserIndex: (index: number) => void;
}

export const ScoreTable: FC<ScoreTableProps> = ({
  scoreTableRef,
  players,
  gameOptions,
  turns,
  activeUserIndex,
  currentTurn,
  width,
  setDroppingOutUserIndex,
}) => {
  const styles = useStyles();

  return (
    <Grid style={styles.scoreTable}>
      <Row style={styles.scoreTableHead}>
        <Col style={styles.scoreTableCol} size={1.5}>
          <Text style={[styles.scoreTableCell, styles.scoreTableBoldCell]}>
            Name
          </Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
            Darts
          </Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
            Avg. per D.
          </Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
            On curr. D.
          </Text>
        </Col>
      </Row>
      <FlatList<User | GuestUser>
        onScrollToIndexFailed={() => {
          /* empty */
        }}
        ref={scoreTableRef}
        data={players}
        style={styles.scoreTabelPlayerList}
        renderItem={({ item: user, index }) => {
          const parsedUser = GameService.stubPlayer(user);
          const userScore = GameHelper.calculateInDoublesGameScoreStatsForUser(
            turns.filter((t) => t.userId === parsedUser.id),
            gameOptions,
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
                <Col style={styles.scoreTableCol} size={1.5}>
                  <Text
                    numberOfLines={1}
                    style={[styles.scoreTableCell, styles.scoreTableBoldCell]}
                  >
                    {parsedUser.name}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1}>
                  <Text
                    style={[styles.scoreTableCell, styles.scoreTableCenterCell]}
                  >
                    {userScore.throws}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1}>
                  <Text
                    style={[styles.scoreTableCell, styles.scoreTableCenterCell]}
                  >
                    {userScore.avgDartsPerDouble}
                  </Text>
                </Col>
                <Col style={styles.scoreTableCol} size={1}>
                  <Text
                    style={[styles.scoreTableCell, styles.scoreTableCenterCell]}
                  >
                    {userScore.onCurrentDouble}
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
