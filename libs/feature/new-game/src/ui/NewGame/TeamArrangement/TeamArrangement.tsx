import { RouteProp, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons, Text } from 'react-native-paper';
import {
  gamePlayerId,
  TeamRoster,
  teamCounts,
  teamThrowingOrder,
  validRoster,
} from '@throwl/shared-domain-models';
import { useAppTheme } from '@throwl/shared-theme';
import { AppHeader, LogoButton } from '@throwl/shared-ui';
import { useNewGame } from '../../../feature/NewGameContext';
import {
  arrangeTeams,
  reconcileTeams,
  shuffled,
} from '../../../feature/team-arrangement';
import { useStartGame } from '../../../feature/useStartGame';
import { GameFlowStackNames, StepperParamList } from '../NewGame';
import { NewGameScreenLayout } from '../NewGameScreenLayout';

export function TeamArrangementScreen() {
  const { params } =
    useRoute<
      RouteProp<StepperParamList, GameFlowStackNames.TEAM_ARRANGEMENT>
    >();
  const { state, setState } = useNewGame();
  const start = useStartGame();
  const { colors } = useAppTheme();
  const [selected, setSelected] = useState<string>();
  const ids = params.players.map(gamePlayerId);
  const formats = teamCounts(ids.length);
  const teams = reconcileTeams(ids, state.teams);
  const canStart = state.format === 'teams' && teams && validRoster(ids, teams);
  const order = canStart ? teamThrowingOrder(teams) : [];
  const names = new Map(
    params.players.map((player) => [gamePlayerId(player), player.name]),
  );

  function updateTeams(next: TeamRoster) {
    setState((current) => ({ ...current, teams: next }));
    setSelected(undefined);
  }

  return (
    <NewGameScreenLayout
      action={
        <LogoButton
          label="GO"
          disabled={!canStart}
          onPress={() => {
            if (canStart) start(params.players, teams);
          }}
        />
      }
    >
      <AppHeader
        title="The Teams"
        right={
          <IconButton
            icon="shuffle-variant"
            accessibilityLabel="Shuffle teams"
            iconColor={colors.onBackground}
            onPress={() => {
              if (canStart)
                updateTeams(arrangeTeams(shuffled(ids), teams.length));
            }}
            disabled={!canStart}
          />
        }
      />
      {canStart ? (
        <View style={styles.content}>
          {formats.length > 1 ? (
            <SegmentedButtons
              value={String(teams.length)}
              onValueChange={(count) => {
                if (
                  formats.includes(Number(count)) &&
                  Number(count) !== teams.length
                ) {
                  updateTeams(arrangeTeams(ids, Number(count)));
                }
              }}
              buttons={formats.map((count) => ({
                value: String(count),
                label: Array(count)
                  .fill(ids.length / count)
                  .join('v'),
              }))}
            />
          ) : (
            <Text variant="titleMedium">
              {Array(teams.length)
                .fill(ids.length / teams.length)
                .join('v')}
            </Text>
          )}
          <Text variant="bodyMedium" style={{ color: colors.secondary }}>
            Tap two players to swap their positions.
          </Text>
          {teams.map(({ members }, teamIndex) => (
            <View
              key={teamIndex}
              style={[
                styles.team,
                {
                  borderColor: colors.outline,
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              <Text
                variant="titleMedium"
                style={{ color: colors.onSecondaryContainer }}
              >{`Team ${teamIndex + 1}`}</Text>
              {members.map((id) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected === id }}
                  accessibilityLabel={`${names.get(id)}, throws ${order.indexOf(id) + 1}`}
                  style={[
                    styles.player,
                    selected === id && { backgroundColor: colors.card },
                  ]}
                  onPress={() => {
                    if (!selected || selected === id) {
                      setSelected(selected === id ? undefined : id);
                      return;
                    }
                    updateTeams(
                      teams.map((team) => ({
                        members: team.members.map((member) =>
                          member === selected
                            ? id
                            : member === id
                              ? selected
                              : member,
                        ),
                      })),
                    );
                  }}
                >
                  <View
                    style={[styles.number, { backgroundColor: colors.primary }]}
                  >
                    <Text
                      variant="labelLarge"
                      style={{ color: colors.onPrimary }}
                    >
                      {order.indexOf(id) + 1}
                    </Text>
                  </View>
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.name,
                      {
                        color:
                          selected === id
                            ? colors.onCard
                            : colors.onSecondaryContainer,
                      },
                    ]}
                  >
                    {names.get(id)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <Text>Go back and choose 4, 6 or 8 distinct players.</Text>
      )}
    </NewGameScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  team: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 10,
  },
  number: {
    borderRadius: 24,
    minWidth: 26,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  name: { flex: 1 },
});
