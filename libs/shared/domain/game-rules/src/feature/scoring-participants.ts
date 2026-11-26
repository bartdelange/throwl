import {
  TeamRoster,
  Turn,
  validRoster,
  teamThrowingOrder,
} from '@throwl/shared-domain-models';

export type ScoringParticipant = {
  id: string;
  name: string;
  members: string[];
};

export function resolveParticipants(
  players: { id: string; name: string }[],
  teams?: TeamRoster,
) {
  const ids = players.map(({ id }) => id);
  if (teams && !validRoster(ids, teams)) throw new Error('Invalid team roster');
  const participants: ScoringParticipant[] = teams
    ? teams.map(({ members }, index) => ({
        id: String(index),
        name: `Team ${index + 1}`,
        members,
      }))
    : players.map(({ id, name }) => ({ id, name, members: [id] }));
  const order = teams ? teamThrowingOrder(teams) : ids;
  const nextThrower = (previousId?: string) =>
    order[(order.indexOf(previousId ?? '') + 1) % order.length];
  const participantFor = (playerId: string) =>
    participants.find(({ members }) => members.includes(playerId));
  return { participants, order, participantFor, nextThrower };
}

export function participantVisits(
  turns: Turn[],
  members: readonly string[],
): Turn[] {
  return turns.filter(({ userId }) => members.includes(userId));
}
