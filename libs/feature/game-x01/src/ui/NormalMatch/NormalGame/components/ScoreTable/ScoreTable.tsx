import { FC, PropsWithChildren, RefObject } from 'react';
import { Text } from 'react-native-paper';
import { useStyles } from './ScoreTable.styles';
import {
  GuestUser,
  TeamRoster,
  Turn,
  User,
} from '@throwl/shared-domain-models';
import { FlatList, StyleSheet, View, ViewProps } from 'react-native';
import { GameService } from '@throwl/shared-data-access-game';
import {
  GameHelper,
  ScoringParticipant,
  resolveParticipants,
  participantVisits,
} from '@throwl/shared-domain-game-rules';
import { AppLogoArrowLight, SwipeActions } from '@throwl/shared-ui';

const gridStyles = StyleSheet.create({
  grid: {
    flex: 1,
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
});

const Grid: FC<ViewProps> = ({ style, ...props }) => (
  <View {...props} style={[gridStyles.grid, style]} />
);

const Row: FC<ViewProps> = ({ style, ...props }) => (
  <View {...props} style={[gridStyles.row, style]} />
);

const Col: FC<PropsWithChildren<ViewProps & { size?: number }>> = ({
  size = 1,
  style,
  ...props
}) => <View {...props} style={[gridStyles.column, { flex: size }, style]} />;

interface ScoreTableProps {
  scoreTableRef: RefObject<FlatList<ScoringParticipant> | null>;
  turns: Turn[];
  players: (User | GuestUser)[];
  startingScore: number;
  teams?: TeamRoster;
  currentTurn: Turn;
  width: number;
  setDroppingOutUserIndex: (index: number) => void;
}

export const ScoreTable: FC<ScoreTableProps> = ({
  scoreTableRef,
  turns,
  players,
  startingScore,
  teams,
  currentTurn,
  width,
  setDroppingOutUserIndex,
}) => {
  const styles = useStyles();
  const { participants } = resolveParticipants(
    players.map(GameService.stubPlayer),
    teams,
  );

  return (
    <Grid style={styles.scoreTable}>
      <Row style={styles.scoreTableHead}>
        <Col style={styles.scoreTableCol} size={2}>
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
            Last
          </Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
            Avg
          </Text>
        </Col>
        <Col style={styles.scoreTableCol} size={1.5}>
          <Text style={[styles.scoreTableCell, styles.scoreTableCenterCell]}>
            Valid Avg
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
            Score
          </Text>
        </Col>
      </Row>
      <FlatList<ScoringParticipant>
        onScrollToIndexFailed={() => {
          /* empty */
        }}
        ref={scoreTableRef}
        data={participants}
        style={styles.scoreTablePlayerList}
        keyExtractor={({ id }) => id}
        renderItem={({ item: participant, index }) => {
          const active = participant.members.includes(currentTurn.userId);
          const visits = participantVisits(turns, participant.members);
          const userScore = GameHelper.calculateInNormalGameScoreStatsForUser(
            visits,
            startingScore,
            active ? currentTurn : undefined,
          );
          const row = (
            <Row style={styles.scoreTableRow}>
              {active && (
                <View style={styles.activeUserIcon}>
                  <AppLogoArrowLight width={width * 0.02} />
                </View>
              )}
              <Col style={styles.scoreTableCol} size={2}>
                <Text
                  numberOfLines={1}
                  style={[styles.scoreTableCell, styles.scoreTableBoldCell]}
                >
                  {participant.name}
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
                  {userScore.last}
                </Text>
              </Col>
              <Col style={styles.scoreTableCol} size={1}>
                <Text
                  style={[styles.scoreTableCell, styles.scoreTableCenterCell]}
                >
                  {userScore.avg}
                </Text>
              </Col>
              <Col style={styles.scoreTableCol} size={1.5}>
                <Text
                  style={[styles.scoreTableCell, styles.scoreTableCenterCell]}
                >
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
          );
          return teams ? (
            row
          ) : (
            <SwipeActions
              bounce={index === 0}
              rightActions={[
                {
                  icon: 'delete',
                  onPress: () => setDroppingOutUserIndex(index),
                },
              ]}
            >
              {row}
            </SwipeActions>
          );
        }}
      />
    </Grid>
  );
};
