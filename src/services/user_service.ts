import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { Service } from '~/services/service';
import { Friend, User } from '~/models/user';

export class UserService implements Service<User> {
  private async parseUser(id: string, user: any): Promise<User> {
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

  public async create(uid: string, email: string, name: string): Promise<User> {
    await firestore().collection('users').doc(uid).set({
      email,
      name,
      friends: [],
    });
    return await this.getById(uid);
  }

  public async getById(uid: string): Promise<User> {
    const userDoc = await firestore().collection('users').doc(uid).get();

    return this.parseUser(uid, userDoc.data());
  }

  public update(uid: string, set: any): Promise<User> {
    return Promise.resolve(undefined) as unknown as Promise<User>;
  }

  public delete(uid: string): Promise<User> {
    return Promise.resolve(undefined) as unknown as Promise<User>;
  }
}
