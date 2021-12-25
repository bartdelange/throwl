import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
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

  public static async addFriend(uid: string, friendEmail: string) {
    let friendByEmail = await firestore()
      .collection('users')
      .where('email', '==', friendEmail)
      .limit(1)
      .get();

    if (!friendByEmail.docs.length) throw 'not found';
    const friendIdByEmail = friendByEmail.docs[0].id;
    if (friendIdByEmail == uid) throw 'same user';

    return firestore().runTransaction(async transaction => {
      await transaction.update(firestore().collection('users').doc(uid), {
        friends: firestore.FieldValue.arrayUnion({
          confirmed: false,
          requester: firestore().collection('users').doc(uid),
          user: firestore().collection('users').doc(friendIdByEmail),
        }),
      });
      await transaction.update(
        firestore().collection('users').doc(friendIdByEmail),
        {
          friends: firestore.FieldValue.arrayUnion({
            confirmed: false,
            requester: firestore().collection('users').doc(uid),
            user: firestore().collection('users').doc(uid),
          }),
        }
      );
    });
  }

  public static async removeFriend(
    uid: string,
    fid: string,
    requesterId?: string
  ) {
    return firestore().runTransaction(async transaction => {
      const userFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: !requesterId,
        user: firestore().collection('users').doc(fid),
      };
      const friendFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: !requesterId,
        user: firestore().collection('users').doc(uid),
      };

      if (!!requesterId) {
        userFriend.requester = firestore().collection('users').doc(requesterId);
        friendFriend.requester = firestore()
          .collection('users')
          .doc(requesterId);
      }

      await transaction.update(firestore().collection('users').doc(uid), {
        friends: firestore.FieldValue.arrayRemove(userFriend),
      });

      await transaction.update(firestore().collection('users').doc(fid), {
        friends: firestore.FieldValue.arrayRemove(friendFriend),
      });
    });
  }

  public static async confirmFriend(uid: string, fid: string) {
    return firestore().runTransaction(async transaction => {
      const userFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: false,
        requester: firestore().collection('users').doc(fid),
        user: firestore().collection('users').doc(fid),
      };
      const friendFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: false,
        requester: firestore().collection('users').doc(fid),
        user: firestore().collection('users').doc(uid),
      };

      // Remove pending request
      await transaction.update(firestore().collection('users').doc(uid), {
        friends: firestore.FieldValue.arrayRemove(userFriend),
      });

      await transaction.update(firestore().collection('users').doc(fid), {
        friends: firestore.FieldValue.arrayRemove(friendFriend),
      });

      // Invert
      delete userFriend.requester;
      userFriend.confirmed = true;
      delete friendFriend.requester;
      friendFriend.confirmed = true;

      // Save confirmed request
      await transaction.update(firestore().collection('users').doc(uid), {
        friends: firestore.FieldValue.arrayUnion(userFriend),
      });

      await transaction.update(firestore().collection('users').doc(fid), {
        friends: firestore.FieldValue.arrayUnion(friendFriend),
      });
    });
  }

  private static async parseUser(uid: string, user: any): Promise<User> {
    const parsedFriends: Friend[] = [];
    if (user.friends && Array.isArray(user.friends)) {
      for (const friend of user.friends) {
        const friendData = (await friend.user.get()).data();
        parsedFriends.push({
          requester: friend.requester?.id,
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
      id: uid,
      email: user.email,
      name: user.name,
      friends: parsedFriends,
    };
  }
}
