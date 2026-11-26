import {
  TeamRoster,
  teamCounts,
  validRoster,
} from '@throwl/shared-domain-models';

export function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function arrangeTeams(ids: string[], count: number): TeamRoster {
  const size = ids.length / count;
  return Array.from({ length: count }, (_, index) => ({
    members: ids.slice(index * size, (index + 1) * size),
  }));
}

export function reconcileTeams(
  ids: string[],
  teams?: TeamRoster,
): TeamRoster | undefined {
  if (teams && validRoster(ids, teams)) return teams;
  const counts = teamCounts(ids.length);
  const count =
    teams && counts.includes(teams.length) ? teams.length : counts[0];
  return count ? arrangeTeams(ids, count) : undefined;
}
