import { Turn } from './turn';
import { GuestUser, User } from './user';

export type GameMode = 'x01' | 'doubles';

export const MAX_GAME_PLAYERS = 8;

export type X01Options = {
  mode: 'x01';
  startingScore: number;
};

export type DoublesOptions = {
  mode: 'doubles';
  quickMatch: boolean;
  skipBull: boolean;
  endOnInvalid: boolean;
};

export type GameOptions = X01Options | DoublesOptions;

export type TeamRoster = { members: string[] }[];

export interface Game {
  id: string;
  players: (Omit<User, 'friends'> | GuestUser)[];
  turns: Turn[];
  teams?: TeamRoster;
  teamGameplayRevision?: number;
  createdBy?: string;
  playerIds?: string[];
  started: Date;
  finished?: Date;
  options: GameOptions;

  // LEGACY for backwards compatibility (optional)
  startingScore?: number;
}

export function gamePlayerId(
  player: Omit<User, 'friends'> | GuestUser,
): string {
  return player.type === 'guest_user' ? player.name : player.id;
}

export function teamCounts(playerCount: number): number[] {
  const counts: number[] = [];
  for (let count = 2; count <= playerCount / 2; count++) {
    if (playerCount % count === 0) counts.push(count);
  }
  return counts;
}

export function validRoster(playerIds: string[], teams: TeamRoster): boolean {
  const assigned = teams.flatMap(({ members }) => members);
  return (
    teamCounts(playerIds.length).includes(teams.length) &&
    teams.every(
      ({ members }) => members.length === playerIds.length / teams.length,
    ) &&
    new Set(playerIds).size === playerIds.length &&
    new Set(assigned).size === playerIds.length &&
    playerIds.every((id) => id.length > 0 && assigned.includes(id))
  );
}
export function teamThrowingOrder(teams: TeamRoster): string[] {
  return teams[0].members.flatMap((_, index) =>
    teams.map(({ members }) => members[index]),
  );
}

export function validGuestName(name: string): boolean {
  return name.length > 0 && name.length <= 80;
}
