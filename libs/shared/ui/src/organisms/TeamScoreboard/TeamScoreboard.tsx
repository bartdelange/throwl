import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { useAppTheme } from '@throwl/shared-theme';
import { AppLogoArrowLight } from '../../atoms/AppLogo';

interface TeamScoreboardProps {
  columns: { label: string; size?: number }[];
  progressLabel: string;
  groups: {
    id: string;
    name: string;
    progress: string | number;
    players: { id: string; name: string; stats: number[] }[];
  }[];
  activeId?: string;
  nextId?: string;
}

export function TeamScoreboard({
  columns,
  progressLabel,
  groups,
  activeId,
  nextId,
}: TeamScoreboardProps) {
  const { colors } = useAppTheme();
  const activeTeam = groups.find(({ players }) =>
    players.some(({ id }) => id === activeId),
  );
  const active = activeTeam?.players.find(({ id }) => id === activeId);
  const next = groups
    .flatMap(({ players }) => players)
    .find(({ id }) => id === nextId);

  return (
    <View style={styles.table}>
      {active && (
        <View style={styles.throwers}>
          <Text variant="titleMedium" style={styles.center}>
            Throwing: {active.name}
            <Text style={{ color: colors.secondary }}>
              {' '}
              · {activeTeam?.name}
            </Text>
          </Text>
          {next && (
            <Text variant="bodyMedium" style={styles.center}>
              Next: {next.name}
            </Text>
          )}
        </View>
      )}
      <ScrollView style={styles.list} stickyHeaderIndices={[0]}>
        <View style={{ backgroundColor: colors.background }}>
          <Divider style={{ backgroundColor: colors.onBackground }} />
          <View style={styles.row}>
            <Text style={styles.name}>Name</Text>
            {columns.map(({ label, size = 1 }) => (
              <Text key={label} style={[styles.stat, { flex: size }]}>
                {label}
              </Text>
            ))}
          </View>
        </View>
        {groups.map((group) => (
          <View
            key={group.id}
            style={styles.group}
            testID={`scoreboard-team-${group.id}`}
          >
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.teamTint,
                { backgroundColor: colors.secondary },
              ]}
            />
            <View
              style={[styles.groupHeading, { borderColor: colors.secondary }]}
            >
              <Text variant="titleMedium" style={styles.teamName}>
                {group.name}
              </Text>
              <Text variant="titleMedium" style={styles.progress}>
                <Text style={{ color: colors.secondary }}>
                  {progressLabel}{' '}
                </Text>
                {group.progress}
              </Text>
            </View>
            {group.players.map((player) => {
              const isActive = player.id === activeId;
              return (
                <View
                  key={player.id}
                  style={styles.row}
                  accessible
                  accessibilityLabel={
                    isActive
                      ? `${player.name}, currently throwing`
                      : player.name
                  }
                  accessibilityValue={{
                    text: columns
                      .map(
                        ({ label }, index) =>
                          `${label}: ${player.stats[index]}`,
                      )
                      .join(', '),
                  }}
                >
                  <View style={styles.name}>
                    {isActive && (
                      <View style={styles.marker}>
                        <AppLogoArrowLight width={9} />
                      </View>
                    )}
                    <Text
                      variant="bodyLarge"
                      numberOfLines={1}
                      style={isActive && styles.activeName}
                    >
                      {player.name}
                    </Text>
                  </View>
                  {columns.map(({ label, size = 1 }, index) => (
                    <Text key={label} style={[styles.stat, { flex: size }]}>
                      {player.stats[index]}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { flex: 1, width: '100%', paddingHorizontal: '5%' },
  throwers: { paddingBottom: 6, alignItems: 'center' },
  center: { textAlign: 'center' },
  list: { flex: 1 },
  group: { marginBottom: 8 },
  teamTint: { opacity: 0.1, borderRadius: 4 },
  activeName: Platform.select({
    android: { fontFamily: 'Jost' },
    default: { fontWeight: '600' },
  }),
  groupHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 5,
    marginHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  teamName: { flex: 1 },
  progress: { flexShrink: 1, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  name: {
    flex: 2.5,
    paddingLeft: 15,
    paddingRight: 4,
    justifyContent: 'center',
  },
  stat: { textAlign: 'center' },
  marker: { position: 'absolute', left: 3 },
});
