import {
    query,
    where,
    doc,
    getDocs,
    limit,
    startAfter,
    orderBy,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
} from '@react-native-firebase/firestore';
import { Game } from '~/models/game';
import { Turn } from '~/models/turn';
import { GuestUser, User } from '~/models/user';
import { UserService } from '~/services/user_service';
import { FirebaseService } from '~/services/firebase_service.ts';

export class GameService extends FirebaseService {
    public static async getOwnGames(
        userId: string,
        take?: number,
        afterDocumentId?: string
    ) {
        const gamesCollection = this.getCollection('games');
        const usersCollection = this.getCollection('users');
        let q = query(
            gamesCollection,
            where('players', 'array-contains', doc(usersCollection, userId)),
            orderBy('started', 'desc')
        );

        if (afterDocumentId) {
            q = query(q, startAfter(doc(gamesCollection, afterDocumentId)));
        }

        if (take && take > 0) {
            q = query(q, limit(take));
        }

        const data = await getDocs(q);
        const games: Promise<Game>[] = [];
        for (const documentSnapshot of data.docs) {
            games.push(
                new Promise<Game>(async resolve => {
                    const gameData = documentSnapshot.data() as Omit<
                        Game,
                        'id'
                    >;
                    resolve(this.parseGame(documentSnapshot.id, gameData));
                })
            );
        }

        return Promise.all<Game>(games);
    }

    public static stubPlayer(
        player: Omit<User, 'friends'> | GuestUser
    ): Omit<User, 'friends'> {
        if (player.type == 'guest_user') {
            return {
                id: player.name,
                name: player.name,
            } as Omit<User, 'friends'>;
        } else {
            return player;
        }
    }

    public static async create(
        players: (User | GuestUser)[],
        turns: Turn[],
        started: Date,
        startingScore: number
    ): Promise<Game> {
        const gamesCollection = this.getCollection('games');
        const usersCollection = this.getCollection('users');

        const newGame = await addDoc(gamesCollection, {
            players: players.map(u => {
                if (u.type === 'user') {
                    return doc(usersCollection, u.id);
                }

                return u.name;
            }),
            turns: turns.length
                ? turns.map(t => ({
                      ...t,
                      userId: doc(usersCollection, t.userId),
                  }))
                : [],
            started,
            finished: null,
            startingScore,
        });
        return await this.getById(newGame.id);
    }

    public static async getById(uid: string): Promise<Game> {
        const gameDocData = await getDoc(doc(this.getCollection('games'), uid));

        return this.parseGame(uid, gameDocData.data());
    }

    public static async update(
        uid: string,
        players: (User | GuestUser)[],
        turns: Turn[],
        startingScore: number,
        finished?: Date
    ): Promise<Game> {
        const gamesCollection = this.getCollection('games');
        const usersCollection = this.getCollection('users');

        await updateDoc(doc(gamesCollection, uid), {
            players: players.map(u => {
                if (u.type === 'user') {
                    return doc(usersCollection, u.id);
                }

                return u.name;
            }),
            turns: turns.length
                ? turns.map(t => ({
                      ...t,
                      userId: doc(usersCollection, t.userId),
                  }))
                : [],
            startingScore,
            finished: finished || null,
        });
        return await this.getById(uid);
    }

    public static async delete(uid: string): Promise<boolean> {
        await deleteDoc(doc(this.getCollection('games'), uid));
        return true;
    }

    private static async parseGame(id: string, game: any): Promise<Game> {
        const players: (User | GuestUser)[] = [];

        for (const player of game.players) {
            if (player.id) {
                players.push({
                    ...(await UserService.getById(player.id)),
                    type: 'user',
                    friends: undefined,
                });
            } else {
                players.push({
                    type: 'guest_user',
                    name: player,
                });
            }
        }

        return {
            id,
            finished: game.finished ? game.finished.toDate() : undefined,
            started: game.started ? game.started.toDate() : undefined,
            players: players,
            turns: game.turns
                .filter((t: any) => !!t)
                .map((t: any) => ({
                    ...t,
                    userId: t.userId.id,
                })),
            startingScore: game.startingScore || 501,
        };
    }
}
