import {
  GameOptions,
  GuestUser,
  TeamRoster,
  Turn,
  User,
  gamePlayerId,
} from '@throwl/shared-domain-models';

type FirestorePlayerRef<Ref> = string | Ref;

type FirestoreTurnWrite<Ref> = Omit<Turn, 'userId'> & {
  userId: Ref | string;
};

type FirestoreGameWrite<Ref> = {
  createdBy: string;
  playerIds: string[];
  historyUserIds: string[];
  players: FirestorePlayerRef<Ref>[];
  turns: FirestoreTurnWrite<Ref>[];
  started: Date;
  finished: Date | null;
  options: GameOptions;
  teams?: { members: FirestorePlayerRef<Ref>[] }[];
  teamGameplayRevision?: number;
  // legacy mirror for x01
  startingScore?: number;
};

export type GameCreate = {
  players: (User | GuestUser)[];
  teams?: TeamRoster;
  turns: Turn[];
  started: Date;
  options: GameOptions;
  finished?: Date;
};

export type GameUpdate = {
  id: string;
  teamGameplayRevision?: number;
  turns: Turn[];
  finished?: Date;
};

export function encodeGameCreate<Ref>(
  { players, teams, turns, started, options, finished }: GameCreate,
  creatorId: string,
  userRef: (id: string) => Ref,
) {
  const playerIds = players
    .filter((u): u is User => u.type === 'user')
    .map((u) => u.id);

  const docData: FirestoreGameWrite<Ref> = {
    createdBy: creatorId,
    playerIds,
    historyUserIds: playerIds,
    players: players.map((u) => {
      if (u.type === 'user') return userRef(u.id);
      return u.name;
    }),
    turns: turns.length
      ? turns.map<FirestoreTurnWrite<Ref>>((t) => ({
          ...t,
          userId: teams ? t.userId : userRef(t.userId),
        }))
      : [],
    started,
    finished: finished ?? null,
    options,
  };

  if (teams) {
    const refs = new Map(
      players.map((player, index) => [
        gamePlayerId(player),
        docData.players[index],
      ]),
    );
    docData.teams = teams.map(({ members }) => ({
      members: members.map((id) => refs.get(id) ?? id),
    }));
    docData.teamGameplayRevision = 0;
  }

  // legacy mirror for x01
  if (options.mode === 'x01') {
    docData.startingScore = options.startingScore;
  }

  return docData;
}

export function encodeGameUpdate<Ref>(
  { turns, finished, teamGameplayRevision }: GameUpdate,
  userRef: (id: string) => Ref,
) {
  const patch: Partial<FirestoreGameWrite<Ref>> = {
    turns: turns.map<FirestoreTurnWrite<Ref>>((t) => ({
      ...t,
      userId: teamGameplayRevision === undefined ? userRef(t.userId) : t.userId,
    })),
    finished: finished ?? null,
  };

  if (teamGameplayRevision !== undefined) {
    patch.teamGameplayRevision = teamGameplayRevision + 1;
  }
  return patch;
}
