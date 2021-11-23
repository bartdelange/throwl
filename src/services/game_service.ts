import firestore from '@react-native-firebase/firestore';
import { Friend, User } from '~/models/user';
import { Turn } from '~/models/turn';
import { Game } from '~/models/game';
import { UserService } from '~/services/user_service';

export class GameService {
  public static async create(
    players: User[],
    turns: Turn[],
    started: Date
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
        started: started || null,
        finished: null,
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
      finished: game.started ? game.started.toDate() : undefined,
      started: game.finished ? game.finished.toDate() : undefined,
      players: players,
      turns: game.turns.map((t: any) => ({
        ...t,
        userId: t.userId.id,
      })),
    };
  }
}
