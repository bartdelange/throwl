// eslint-disable-file max-lines
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';

import {
  DartboardScoreType,
  DoublesOptions,
  Game,
  GameOptions,
  GuestUser,
  MAX_GAME_PLAYERS,
  Turn,
  TeamRoster,
  gamePlayerId,
  validRoster,
  teamThrowingOrder,
  User,
  X01Options,
} from '@throwl/shared-domain-models';
import { UserService } from '@throwl/shared-data-access-user';
import { FirebaseService } from '@throwl/shared-data-access-firebase';
import { getAuth } from '@react-native-firebase/auth';

import {
  encodeGameCreate,
  encodeGameUpdate,
  GameCreate,
  GameUpdate,
} from './game-write';

type FirestorePlayerRef = string | DocumentReference;

type FirestoreGameRead = DocumentData & {
  players?: FirestorePlayerRef[];
  turns?: unknown;
  started?: Timestamp;
  finished?: Timestamp | null;
  options?: unknown;
  startingScore?: number;
};

const scoreTypes = new Set<string>(Object.values(DartboardScoreType));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTurnsArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function parseTurn(value: unknown, playerIds: Set<string>): Turn | undefined {
  if (!isRecord(value) || !Array.isArray(value.throws)) return undefined;

  const rawUserId = value.userId;
  const userId =
    typeof rawUserId === 'string'
      ? rawUserId
      : isRecord(rawUserId) && typeof rawUserId.id === 'string'
        ? rawUserId.id
        : undefined;
  if (!userId || !playerIds.has(userId)) return undefined;

  if (value.throws.length > 3) return undefined;
  const throws: Turn['throws'] = [];
  for (const thrw of value.throws) {
    if (
      !isRecord(thrw) ||
      typeof thrw.type !== 'string' ||
      !scoreTypes.has(thrw.type) ||
      typeof thrw.score !== 'number' ||
      !Number.isFinite(thrw.score) ||
      (thrw.isValid !== undefined && typeof thrw.isValid !== 'boolean')
    ) {
      return undefined;
    }
    throws.push({
      type: thrw.type as DartboardScoreType,
      score: thrw.score,
      ...(thrw.isValid === undefined ? {} : { isValid: thrw.isValid }),
    });
  }

  return {
    userId,
    throws,
    ...(typeof value.username === 'string' ? { username: value.username } : {}),
    ...(typeof value.isValid === 'boolean' ? { isValid: value.isValid } : {}),
  };
}

function parseTimestamp(value: unknown): Date | undefined {
  if (!isRecord(value) || typeof value.toDate !== 'function') return undefined;
  try {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime())
      ? date
      : undefined;
  } catch {
    return undefined;
  }
}

function isX01Options(
  value: unknown,
): value is { mode: 'x01'; startingScore?: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { mode?: unknown }).mode === 'x01'
  );
}

function isDoublesOptions(value: unknown): value is {
  mode: 'doubles';
  quickMatch?: unknown;
  skipBull?: unknown;
  endOnInvalid?: unknown;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { mode?: unknown }).mode === 'doubles'
  );
}

export class GameService extends FirebaseService {
  public static async getPlayedGames(
    userId: string,
    take?: number,
    afterDocumentId?: string,
  ) {
    const gamesCollection = this.getCollection('games');

    let q = query(
      gamesCollection,
      where('historyUserIds', 'array-contains', userId),
      orderBy('started', 'desc'),
    );

    if (afterDocumentId) {
      const afterSnap = await getDoc(doc(gamesCollection, afterDocumentId));
      if (afterSnap.exists()) {
        q = query(q, startAfter(afterSnap));
      }
    }

    if (take && take > 0) {
      q = query(q, limit(take));
    }

    const data = await getDocs(q);
    const parsed = await Promise.allSettled(
      data.docs.map((docSnap: QueryDocumentSnapshot) =>
        this.parseGame(docSnap.id, docSnap.data()),
      ),
    );
    return parsed.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
  }

  public static stubPlayer(
    player: Omit<User, 'friends'> | GuestUser,
  ): Omit<User, 'friends'> {
    if (player.type === 'guest_user') {
      // guest users don't have the full User shape; we return the minimal fields your UI uses
      return {
        id: player.name,
        name: player.name,
      } as Omit<User, 'friends'>;
    }
    return player;
  }

  /**
   * Persist helper:
   * - creates a game if gameId is not provided
   * - updates otherwise
   * - supports finishing on first persist
   *
   * Returns the resolved gameId.
   */
  public static async persistGame({
    gameId,
    players,
    turns,
    options,
    started,
    finished,
    setGameId,
    teams,
    teamGameplayRevision,
  }: {
    gameId?: string;
    players: (User | GuestUser)[];
    turns: Turn[];
    options: GameOptions;
    started?: Date;
    finished?: boolean;
    teams?: TeamRoster;
    teamGameplayRevision?: number;
    setGameId?: (id: string) => void;
  }): Promise<string> {
    if (!gameId) {
      const created = await this.create({
        players,
        teams,
        turns,
        started: started ?? new Date(),
        options,
        finished: finished ? new Date() : undefined,
      });

      setGameId?.(created.id);
      return created.id;
    }

    await this.update({
      id: gameId,
      teamGameplayRevision,
      turns,
      finished: finished ? new Date() : undefined,
    });

    setGameId?.(gameId);
    return gameId;
  }

  public static async create(game: GameCreate): Promise<Game> {
    return this.getById(await this.writeNewGame(game));
  }

  public static async writeNewGame(game: GameCreate): Promise<string> {
    const { players, teams } = game;
    if (players.length > MAX_GAME_PLAYERS) {
      throw new Error(`A game supports at most ${MAX_GAME_PLAYERS} players`);
    }
    if (teams && !validRoster(players.map(gamePlayerId), teams)) {
      throw new Error('Invalid team roster');
    }
    if (teams && !players.some(({ type }) => type === 'user')) {
      throw new Error('A team game requires a registered player');
    }
    const creatorId = getAuth().currentUser?.uid;
    if (!creatorId)
      throw new Error('A signed-in user is required to create a game');

    const users = this.getCollection('users');
    const data = encodeGameCreate(game, creatorId, (id) => doc(users, id));
    const result = await addDoc(this.getCollection('games'), data);
    return result.id;
  }

  public static async getById(uid: string): Promise<Game> {
    const snap = await getDoc(doc(this.getCollection('games'), uid));
    if (!snap.exists()) {
      throw new Error(`Game not found: ${uid}`);
    }
    return this.parseGame(uid, snap.data() as FirestoreGameRead);
  }

  public static async update(game: GameUpdate): Promise<Game> {
    await this.writeGameUpdate(game);
    return this.getById(game.id);
  }

  public static async writeGameUpdate(game: GameUpdate): Promise<void> {
    const users = this.getCollection('users');
    await updateDoc(
      doc(this.getCollection('games'), game.id),
      encodeGameUpdate(game, (id) => doc(users, id)),
    );
  }

  public static async removeFromHistory(
    gameId: string,
    userId: string,
  ): Promise<void> {
    await updateDoc(doc(this.getCollection('games'), gameId), {
      historyUserIds: arrayRemove(userId),
    });
  }

  public static async restoreToHistory(
    gameId: string,
    userId: string,
  ): Promise<void> {
    await updateDoc(doc(this.getCollection('games'), gameId), {
      historyUserIds: arrayUnion(userId),
    });
  }

  public static async physicallyDeleteGame(uid: string): Promise<boolean> {
    await deleteDoc(doc(this.getCollection('games'), uid));
    return true;
  }

  private static normalizeOptions(game: {
    options?: unknown;
    startingScore?: unknown;
  }): GameOptions {
    const rawOptions = game.options;

    if (isX01Options(rawOptions)) {
      const startingScore =
        typeof rawOptions.startingScore === 'number' &&
        Number.isFinite(rawOptions.startingScore)
          ? rawOptions.startingScore
          : typeof game.startingScore === 'number' &&
              Number.isFinite(game.startingScore)
            ? (game.startingScore as number)
            : 501;

      return { mode: 'x01', startingScore } satisfies X01Options;
    }

    if (isDoublesOptions(rawOptions)) {
      return {
        mode: 'doubles',
        quickMatch: !!rawOptions.quickMatch,
        skipBull: !!rawOptions.skipBull,
        endOnInvalid: !!rawOptions.endOnInvalid,
      } satisfies DoublesOptions;
    }

    const fallback =
      typeof game.startingScore === 'number' &&
      Number.isFinite(game.startingScore)
        ? (game.startingScore as number)
        : 501;

    return { mode: 'x01', startingScore: fallback } satisfies X01Options;
  }

  private static async parseGame(
    id: string,
    game: FirestoreGameRead,
  ): Promise<Game> {
    const started = parseTimestamp(game?.started);
    if (!started) {
      throw new Error(`Game ${id} has an invalid started timestamp`);
    }

    const players: (User | GuestUser)[] = [];

    for (const player of game?.players ?? []) {
      // Firestore user ref: DocumentReference has `.id`
      if (typeof player !== 'string' && player?.id) {
        players.push({
          ...(await UserService.getPublicById(player.id)),
          type: 'user',
          friends: undefined,
        });
      } else if (typeof player === 'string') {
        players.push({
          type: 'guest_user',
          name: player,
        });
      } else {
        throw new Error(`Game ${id} contains an invalid player`);
      }
    }

    if (players.length === 0) {
      throw new Error(`Game ${id} does not contain any players`);
    }

    const options = this.normalizeOptions({
      options: game?.options,
      startingScore: game?.startingScore,
    });

    const rawTurns = isTurnsArray(game?.turns) ? game.turns : [];
    const playerIds = new Set(
      players.map((player) =>
        player.type === 'user' ? player.id : player.name,
      ),
    );
    const turns = rawTurns.flatMap((turn) => {
      const parsed = parseTurn(turn, playerIds);
      return parsed ? [parsed] : [];
    });

    const finished = parseTimestamp(game?.finished);
    let teams: TeamRoster | undefined;
    const teamGameplayRevision: unknown = game.teamGameplayRevision;
    if (game.teams !== undefined) {
      if (
        !Array.isArray(game.teams) ||
        typeof teamGameplayRevision !== 'number' ||
        !Number.isSafeInteger(teamGameplayRevision) ||
        teamGameplayRevision < 0
      ) {
        throw new Error(`Game ${id} has invalid team data`);
      }
      teams = game.teams.map((team: unknown) => {
        if (!isRecord(team) || !Array.isArray(team.members))
          throw new Error('Invalid team members');
        return {
          members: team.members.map((member: unknown) => {
            if (typeof member === 'string') return member;
            if (isRecord(member) && typeof member.id === 'string')
              return member.id;
            throw new Error('Invalid team member');
          }),
        };
      });
      if (
        !validRoster(players.map(gamePlayerId), teams) ||
        turns.length !== rawTurns.length
      ) {
        throw new Error(`Game ${id} has invalid team roster or visits`);
      }
      const order = teamThrowingOrder(teams);
      if (
        turns.some(
          (turn, index) =>
            turn.userId !== order[index % order.length] ||
            turn.throws.length === 0,
        )
      ) {
        throw new Error(`Game ${id} has invalid throwing order`);
      }
    }

    return {
      id,
      finished,
      started,
      ...(teams && typeof teamGameplayRevision === 'number'
        ? { teams, teamGameplayRevision }
        : {}),
      ...(typeof game.createdBy === 'string'
        ? { createdBy: game.createdBy }
        : {}),
      players,
      turns,
      options,
      // legacy convenience
      startingScore: options.mode === 'x01' ? options.startingScore : undefined,
    };
  }
}
