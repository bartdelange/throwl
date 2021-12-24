import firestore from '@react-native-firebase/firestore';
import { Friend, User } from '~/models/user';

export class UserService {
  public static listenToUserChanges(
    uid: string,
    onNext: (snapshot: User) => void,
    onError?: (error: Error) => void,
    onCompletion?: () => void
  ) {
    return firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(
        async data => {
          const userData = (await data.data()) as Omit<User, 'id'>;
          onNext(await this.parseUser(data.id, userData));
        },
        onError,
        onCompletion
      );
  }

  public static async create(
    uid: string,
    email: string,
    name: string
  ): Promise<User> {
    await firestore().collection('users').doc(uid).set({
      email,
      name,
      friends: [],
    });
    return await this.getById(uid);
  }

  public static async getById(uid: string): Promise<User> {
    const userDoc = await firestore().collection('users').doc(uid).get();

    return this.parseUser(uid, userDoc.data());
  }

  public static async updateEmail(uid: string, email: string) {
    await firestore().collection('users').doc(uid).update({
      email,
    });
  }

  public static async updateName(uid: string, name: string) {
    await firestore().collection('users').doc(uid).update({
      name,
    });
  }

  public static removeFriend(uid: string, friendId: string) {
    return Promise.resolve(undefined) as unknown as Promise<User>;
  }

  private static async parseUser(id: string, user: any): Promise<User> {
    const parsedFriends: Friend[] = [];
    if (user.friends && Array.isArray(user.friends)) {
      for (const friend of user.friends) {
        const friendData = (await friend.user.get()).data();
        parsedFriends.push({
          requester: friend.requester,
          confirmed: friend.confirmed,
          user: {
            id: friend.user.id,
            email: friendData.email,
            name: friendData.name,
          },
        });
      }
    }
    return {
      id,
      email: user.email,
      name: user.name,
      friends: parsedFriends,
    };
  }
}
