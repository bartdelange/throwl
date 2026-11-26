import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import {
  TeamRoster,
  teamCounts,
  teamThrowingOrder,
} from '@throwl/shared-domain-models';

export function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function seedTeams(ids: string[], count: number): TeamRoster {
  const size = ids.length / count;
  return Array.from({ length: count }, (_, index) => ({
    members: ids.slice(index * size, (index + 1) * size),
  }));
}

function moveEarlier<T>(items: T[], index: number): T[] {
  const reordered = [...items];
  [reordered[index - 1], reordered[index]] = [
    reordered[index],
    reordered[index - 1],
  ];
  return reordered;
}

const styles = StyleSheet.create({
  formats: { flexDirection: 'row', flexWrap: 'wrap' },
  editor: { maxHeight: 200 },
});

interface TeamSetupProps {
  teams?: TeamRoster;
  players: { id: string; name: string }[];
  rosterIsValid: boolean;
  onChange: (teams?: TeamRoster) => void;
}

export function TeamSetup({
  teams,
  players,
  rosterIsValid,
  onChange,
}: TeamSetupProps) {
  const [swapPlayer, setSwapPlayer] = useState<string>();
  const selectedIds = players.map(({ id }) => id);
  const availableTeamCounts = teamCounts(selectedIds.length);
  const playerName = (id: string) =>
    players.find((player) => player.id === id)?.name ?? id;
  const selectMember = (id: string) => {
    if (!teams || !swapPlayer || swapPlayer === id) {
      setSwapPlayer(swapPlayer === id ? undefined : id);
      return;
    }
    onChange(
      teams.map(({ members }) => ({
        members: members.map((member) =>
          member === swapPlayer ? id : member === id ? swapPlayer : member,
        ),
      })),
    );
    setSwapPlayer(undefined);
  };

  return (
    <>
      {(availableTeamCounts.length > 0 || teams) && (
        <View style={styles.formats}>
          <Button
            mode={teams ? 'text' : 'contained'}
            onPress={() => {
              onChange(undefined);
              setSwapPlayer(undefined);
            }}
          >
            Individual
          </Button>
          {availableTeamCounts.map((count) => (
            <Button
              key={count}
              mode={teams?.length === count ? 'contained' : 'text'}
              onPress={() => {
                onChange(seedTeams(selectedIds, count));
                setSwapPlayer(undefined);
              }}
            >
              {Array(count)
                .fill(selectedIds.length / count)
                .join('v')}
            </Button>
          ))}
          {teams && !rosterIsValid && (
            <Text>
              Select a team format for the current players, or choose
              Individual.
            </Text>
          )}
        </View>
      )}
      {teams && rosterIsValid && (
        <>
          <Text>{`Throwing order: ${teamThrowingOrder(teams).map(playerName).join(' → ')}`}</Text>
          <ScrollView style={styles.editor} keyboardShouldPersistTaps="handled">
            <Button
              onPress={() => {
                onChange(seedTeams(shuffled(selectedIds), teams.length));
                setSwapPlayer(undefined);
              }}
            >
              Shuffle teams
            </Button>
            <Button
              onPress={() => {
                onChange(
                  shuffled(teams).map(({ members }) => ({
                    members: shuffled(members),
                  })),
                );
                setSwapPlayer(undefined);
              }}
            >
              Shuffle throwing order
            </Button>
            <Text>Tap two players to swap their positions.</Text>
            {teams.map(({ members }, teamIndex) => (
              <View key={teamIndex}>
                <Text>{`Team ${teamIndex + 1}`}</Text>
                {teamIndex > 0 && (
                  <Button
                    onPress={() => onChange(moveEarlier(teams, teamIndex))}
                  >
                    {`Move Team ${teamIndex + 1} earlier`}
                  </Button>
                )}
                {members.map((id, index) => (
                  <View key={id}>
                    <Button
                      mode={swapPlayer === id ? 'contained' : 'text'}
                      onPress={() => selectMember(id)}
                    >
                      {playerName(id)}
                    </Button>
                    {index > 0 && (
                      <Button
                        onPress={() =>
                          onChange(
                            teams.map((team, position) =>
                              position === teamIndex
                                ? { members: moveEarlier(members, index) }
                                : team,
                            ),
                          )
                        }
                      >{`Move ${playerName(id)} earlier`}</Button>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </>
  );
}
