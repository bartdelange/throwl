import { FC, PropsWithChildren, RefObject } from 'react';
import { Text } from 'react-native-paper';
import { useStyles } from './ScoreTable.styles';
import {
  DoublesOptions,
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
  DoublesGameHelper,
} from '@throwl/shared-domain-game-rules';
import {
  AppLogoArrowLight,
  SwipeActions,
  TeamScoreboard,
} from '@throwl/shared-ui';

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
  gameOptions: DoublesOptions;
  players: (User | GuestUser)[];
  turns: Turn[];
  teams?: TeamRoster;
  activeUserIndex: number;
  finished?: boolean;
  currentTurn: Turn;
  width: number;
  setDroppingOutUserIndex: (index: number) => void;
}

export const ScoreTable: FC<ScoreTableProps> = ({
  scoreTableRef,
  players,
  gameOptions,
  turns,
  teams,
  activeUserIndex,
  finished,
  currentTurn,
  width,
  setDroppingOutUserIndex,
}) => {
  const styles = useStyles();
  const lineup = players.map(GameService.stubPlayer);
  const { participants, nextThrower } = resolveParticipants(lineup, teams);

  if (teams) {
    return (
      <TeamScoreboard
        columns={[{ label: 'Darts' }, { label: 'Avg. per D.' }]}
        progressLabel="Target"
        activeId={finished ? undefined : currentTurn.userId}
        nextId={finished ? undefined : nextThrower(currentTurn.userId)}
        groups={participants.map((team) => {
          const visits = participantVisits(turns, team.members);
          if (!finished && team.members.includes(currentTurn.userId))
            visits.push(currentTurn);
          const { next } = DoublesGameHelper.getNextDoubleNeeded(
            visits,
            team.members,
            gameOptions,
          );
          return {
            ...team,
            progress: next ? GameHelper.createScoreString(next) : '—',
            players: team.members.map((id) => {
              const { totalDarts, avgDartsPerDouble } =
                GameHelper.getPostDoublesGameTurnStats(
                  participantVisits(visits, [id]),
                  gameOptions,
                  visits,
                  id,
                );
              return {
                id,
                name: lineup.find((player) => player.id === id)?.name ?? id,
                stats: [totalDarts, avgDartsPerDouble],
              };
            }),
          };
        })}
      />
    );
  }

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
      <FlatList<ScoringParticipant>
        onScrollToIndexFailed={() => {
          /* empty */
        }}
        ref={scoreTableRef}
        data={participants}
        style={styles.scoreTabelPlayerList}
        keyExtractor={({ id }) => id}
        renderItem={({ item: participant, index }) => {
          const active = activeUserIndex === index;
          const visits = participantVisits(turns, participant.members);
          const userScore = GameHelper.calculateInDoublesGameScoreStatsForUser(
            visits,
            gameOptions,
            active ? currentTurn : undefined,
          );
          const row = (
            <Row style={styles.scoreTableRow}>
              {active && (
                <View style={styles.activeUserIcon}>
                  <AppLogoArrowLight width={width * 0.02} />
                </View>
              )}
              <Col style={styles.scoreTableCol} size={1.5}>
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
          );
          return (
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
