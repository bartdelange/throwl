import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

import { DoublesOptions, Game, GameOptions, X01Options } from '~/models/game';
import { Turn } from '~/models/turn';
import { GuestUser, User } from '~/models/user';
import { UserService } from '~/services/user_service';
import { FirebaseService } from '~/services/firebase_service.ts';
import { QuerySnapshot } from '@firebase/firestore';

type FirestorePlayerRef = string | FirebaseFirestoreTypes.DocumentReference;

type FirestoreTurnWrite = Omit<Turn, 'userId'> & {
  userId: FirebaseFirestoreTypes.DocumentReference;
};

type FirestoreGameWrite = {
  players: FirestorePlayerRef[];
  turns: FirestoreTurnWrite[];
  started: Date;
  finished: Date | null;
  options: GameOptions;
  // legacy mirror for x01
  startingScore?: number;
};

type FirestoreTurnRead = Partial<Omit<Turn, 'userId'>> & {
  userId?: FirebaseFirestoreTypes.DocumentReference | string;
};

type FirestoreGameRead = FirebaseFirestoreTypes.DocumentData & {
  players?: FirestorePlayerRef[];
  turns?: unknown;
  started?: FirebaseFirestoreTypes.Timestamp;
  finished?: FirebaseFirestoreTypes.Timestamp | null;
  options?: unknown;
  startingScore?: number;
};

function isFirestoreTurnRead(value: unknown): value is FirestoreTurnRead {
  return typeof value === 'object' && value !== null;
}

function isTurnsArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isX01Options(value: unknown): value is { mode: 'x01'; startingScore?: number } {
  return (
    typeof value === 'object' && value !== null && (value as { mode?: unknown }).mode === 'x01'
  );
}

function isDoublesOptions(
  value: unknown,
): value is { mode: 'doubles'; quickMatch?: unknown; skipBull?: unknown; endOnInvalid?: unknown } {
  return (
    typeof value === 'object' && value !== null && (value as { mode?: unknown }).mode === 'doubles'
  );
}

export class GameService extends FirebaseService {
  public static async getOwnGames(userId: string, take?: number, afterDocumentId?: string) {
    const gamesCollection = this.getCollection('games');
    const usersCollection = this.getCollection('users');

    let q = query(
      gamesCollection,
      where('players', 'array-contains', doc(usersCollection, userId)),
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

    const data: QuerySnapshot = await getDocs(q);
    return Promise.all(data.docs.map(docSnap => this.parseGame(docSnap.id, docSnap.data())));
  }

  public static stubPlayer(player: Omit<User, 'friends'> | GuestUser): Omit<User, 'friends'> {
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
      players,
      turns,
      options,
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
    const gamesCollection = this.getCollection('games');
    const usersCollection = this.getCollection('users');

    const docData: FirestoreGameWrite = {
      players: players.map(u => {
        if (u.type === 'user') return doc(usersCollection, u.id);
        return u.name;
      }),
      turns: turns.length
        ? turns.map<FirestoreTurnWrite>(t => ({
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
    players,
    turns,
    options,
    finished,
  }: {
    id: string;
    players: (User | GuestUser)[];
    turns: Turn[];
    options: GameOptions;
    finished?: Date;
  }): Promise<Game> {
    const gamesCollection = this.getCollection('games');
    const usersCollection = this.getCollection('users');

    const patch: Partial<FirestoreGameWrite> = {
      players: players.map(u => {
        if (u.type === 'user') return doc(usersCollection, u.id);
        return u.name;
      }),
      turns: turns.length
        ? turns.map<FirestoreTurnWrite>(t => ({
            ...t,
            userId: doc(usersCollection, t.userId),
          }))
        : [],
      finished: finished ?? null,
      options,
    };

    // legacy mirror for x01
    if (options.mode === 'x01') {
      patch.startingScore = options.startingScore;
    }

    await updateDoc(doc(gamesCollection, id), patch);
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
        typeof rawOptions.startingScore === 'number'
          ? rawOptions.startingScore
          : typeof game.startingScore === 'number'
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

    const fallback = typeof game.startingScore === 'number' ? (game.startingScore as number) : 501;

    return { mode: 'x01', startingScore: fallback } satisfies X01Options;
  }

  private static async parseGame(id: string, game: FirestoreGameRead): Promise<Game> {
    const players: (User | GuestUser)[] = [];

    for (const player of game?.players ?? []) {
      // Firestore user ref: DocumentReference has `.id`
      if (typeof player !== 'string' && player?.id) {
        players.push({
          ...(await UserService.getById(player.id)),
          type: 'user',
          friends: undefined,
        });
      } else if (typeof player === 'string') {
        players.push({
          type: 'guest_user',
          name: player,
        });
      }
    }

    const options = this.normalizeOptions({
      options: game?.options,
      startingScore: game?.startingScore,
    });

    const rawTurns = isTurnsArray(game?.turns) ? game.turns : [];

    const turns: Turn[] = rawTurns.filter(isFirestoreTurnRead).map((t): Turn => {
      const userId = typeof t.userId === 'string' ? t.userId : (t.userId?.id ?? '');

      return {
        ...(t as Omit<Turn, 'userId'>),
        userId,
      };
    });

    return {
      id,
      finished: game?.finished ? game.finished.toDate() : undefined,
      started: game?.started ? game.started.toDate() : new Date(),
      players,
      turns,
      options,
      // legacy convenience
      startingScore: options.mode === 'x01' ? options.startingScore : undefined,
    };
  }
}
