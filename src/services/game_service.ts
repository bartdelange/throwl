import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { User } from '~/models/user';
import { Turn } from '~/models/turn';
import { Game } from '~/models/game';
import { UserService } from '~/services/user_service';

export class GameService {
  public static async getOwnGames(
    userId: string,
    limit?: number,
    afterDocumentId?: string
  ) {
    let query = firestore()
      .collection('games')
      .where(
        'players',
        'array-contains',
        firestore().collection('users').doc(userId)
      )
      .orderBy('started', 'desc');

    if (afterDocumentId) {
      query = query.startAfter(
        await firestore().collection('games').doc(afterDocumentId).get()
      );
    }

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const data = await query.get();
    const games: Promise<Game>[] = [];
    for (const documentSnapshot of data.docs) {
      games.push(
        new Promise<Game>(async resolve => {
          const gameData = (await documentSnapshot.data()) as Omit<Game, 'id'>;
          resolve(this.parseGame(documentSnapshot.id, gameData));
        })
      );
    }

    return Promise.all<Game>(games);
  }

  public static async create(
    players: User[],
    turns: Turn[],
    started: Date,
    startingScore: number
  ): Promise<Game> {
    const newGame = await firestore()
      .collection('games')
      .add({
        players: players.map(u => firestore().collection('users').doc(u.id)),
        turns: turns.length
          ? turns.map(t => ({
              ...t,
              userId: firestore().collection('users').doc(t.userId),
            }))
          : [],
        started,
        finished: null,
        startingScore,
      });
    return await this.getById(newGame.id);
  }

  public static async getById(uid: string): Promise<Game> {
    const gameDoc = await firestore().collection('games').doc(uid).get();

    return this.parseGame(uid, gameDoc.data());
  }

  public static async update(
    uid: string,
    players: User[],
    turns: Turn[],
    startingScore: number,
    finished?: Date
  ): Promise<Game> {
    await firestore()
      .collection('games')
      .doc(uid)
      .update({
        players: players.map(u => firestore().collection('users').doc(u.id)),
        turns: turns.length
          ? turns.map(t => ({
              ...t,
              userId: firestore().collection('users').doc(t.userId),
            }))
          : [],
        startingScore,
        finished: finished || null,
      });
    return await this.getById(uid);
  }

  public static async delete(uid: string): Promise<boolean> {
    await firestore().collection('games').doc(uid).delete();
    return true;
  }

  private static async parseGame(id: string, game: any): Promise<Game> {
    const players: User[] = [];

    for (const player of game.players) {
      players.push({
        ...(await UserService.getById(player.id)),
        friends: undefined,
      });
    }

    return {
      id,
      finished: game.finished ? game.finished.toDate() : undefined,
      started: game.started ? game.started.toDate() : undefined,
      players: players,
      turns: game.turns.map((t: any) => ({
        ...t,
        userId: t.userId.id,
      })),
      startingScore: game.startingScore || 501,
    };
  }
}
