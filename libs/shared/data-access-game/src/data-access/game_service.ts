// eslint-disable-file max-lines
import {
  addDoc,
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
  User,
  X01Options,
} from '@throwl/shared-domain-models';
import { UserService } from '@throwl/shared-data-access-user';
import { FirebaseService } from '@throwl/shared-data-access-firebase';
import { getAuth } from '@react-native-firebase/auth';

type FirestorePlayerRef = string | DocumentReference;

type FirestoreTurnWrite = Omit<Turn, 'userId'> & {
  userId: DocumentReference;
};

type FirestoreGameWrite = {
  owner: string;
  playerIds: string[];
  players: FirestorePlayerRef[];
  turns: FirestoreTurnWrite[];
  started: Date;
  finished: Date | null;
  options: GameOptions;
  // legacy mirror for x01
  startingScore?: number;
};

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
  public static async getOwnGames(
    userId: string,
    take?: number,
    afterDocumentId?: string,
  ) {
    const gamesCollection = this.getCollection('games');

    let q = query(
      gamesCollection,
      where('playerIds', 'array-contains', userId),
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
  }: {
    gameId?: string;
    players: (User | GuestUser)[];
    turns: Turn[];
    options: GameOptions;
    started?: Date;
    finished?: boolean;
    setGameId?: (id: string) => void;
  }): Promise<string> {
    if (!gameId) {
      const created = await this.create({
        players,
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
      turns,
      finished: finished ? new Date() : undefined,
    });

    setGameId?.(gameId);
    return gameId;
  }

  public static async create({
    players,
    turns,
    started,
    options,
    finished,
  }: {
    players: (User | GuestUser)[];
    turns: Turn[];
    started: Date;
    options: GameOptions;
    finished?: Date;
  }): Promise<Game> {
    if (players.length > MAX_GAME_PLAYERS) {
      throw new Error(`A game supports at most ${MAX_GAME_PLAYERS} players`);
    }

    const gamesCollection = this.getCollection('games');
    const usersCollection = this.getCollection('users');
    const ownerId = getAuth().currentUser?.uid;
    if (!ownerId)
      throw new Error('A signed-in user is required to create a game');

    const docData: FirestoreGameWrite = {
      owner: ownerId,
      playerIds: players
        .filter((u): u is User => u.type === 'user')
        .map((u) => u.id),
      players: players.map((u) => {
        if (u.type === 'user') return doc(usersCollection, u.id);
        return u.name;
      }),
      turns: turns.length
        ? turns.map<FirestoreTurnWrite>((t) => ({
            ...t,
            userId: doc(usersCollection, t.userId),
          }))
        : [],
      started,
      finished: finished ?? null,
      options,
    };

    // legacy mirror for x01
    if (options.mode === 'x01') {
      docData.startingScore = options.startingScore;
    }

    const newGame = await addDoc(gamesCollection, docData);
    return await this.getById(newGame.id);
  }

  public static async getById(uid: string): Promise<Game> {
    const snap = await getDoc(doc(this.getCollection('games'), uid));
    if (!snap.exists()) {
      throw new Error(`Game not found: ${uid}`);
    }
    return this.parseGame(uid, snap.data() as FirestoreGameRead);
  }

  public static async update({
    id,
    turns,
    finished,
  }: {
    id: string;
    turns: Turn[];
    finished?: Date;
  }): Promise<Game> {
    const gamesCollection = this.getCollection('games');
    const usersCollection = this.getCollection('users');

    const gameRef = doc(gamesCollection, id);

    const patch: Partial<FirestoreGameWrite> = {
      turns: turns.map<FirestoreTurnWrite>((t) => ({
        ...t,
        userId: doc(usersCollection, t.userId),
      })),
      finished: finished ?? null,
    };

    await updateDoc(gameRef, patch);
    return await this.getById(id);
  }

  public static async delete(uid: string): Promise<boolean> {
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

    const started = parseTimestamp(game?.started) ?? new Date();
    const finished = parseTimestamp(game?.finished);

    return {
      id,
      finished,
      started,
      players,
      turns,
      options,
      // legacy convenience
      startingScore: options.mode === 'x01' ? options.startingScore : undefined,
    };
  }
}
