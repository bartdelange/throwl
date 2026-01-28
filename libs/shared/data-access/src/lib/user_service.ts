import {
  arrayRemove,
  arrayUnion,
  doc,
  FirebaseFirestoreTypes,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { Friend, User } from '@throwl/shared-domain-models';
import { FirebaseService } from './firebase_service';

type UserDoc = {
  email: string;
  name: string;
  friends?: Array<{
    confirmed: boolean;
    requester?: FirebaseFirestoreTypes.DocumentReference;
    user: FirebaseFirestoreTypes.DocumentReference;
  }>;
};

export class UserService extends FirebaseService {
  public static listenToUserChanges(
    uid: string,
    onNext: (snapshot: User) => void,
    onError?: (error: Error) => void,
    onCompletion?: () => void,
  ) {
    const usersCollection = this.getCollection('users');
    return onSnapshot(
      doc(usersCollection, uid),
      async (data) => {
        const userData = data.data() as UserDoc | undefined;
        onNext(await this.parseUser(data.id, userData));
      },
      onError,
      onCompletion,
    );
  }

  public static async create(
    uid: string,
    email: string,
    name: string,
  ): Promise<User> {
    const usersCollection = this.getCollection('users');
    await setDoc(doc(usersCollection, uid), {
      email,
      name,
      friends: [],
    });
    return await this.getById(uid);
  }

  public static async getById(uid: string): Promise<User> {
    const uDoc = doc(this.getCollection('users'), uid);
    const userDoc = await getDoc(uDoc);

    return this.parseUser(uid, userDoc.data() as UserDoc | undefined);
  }

  public static async updateEmail(uid: string, email: string) {
    await updateDoc(doc(this.getCollection('users'), uid), {
      email,
    });
  }

  public static async updateName(uid: string, name: string) {
    await updateDoc(doc(this.getCollection('users'), uid), {
      name,
    });
  }

  public static async addFriend(uid: string, friendEmail: string) {
    const usersCollection = this.getCollection('users');
    const friendByEmail = await getDocs(
      query(usersCollection, where('email', '==', friendEmail), limit(1)),
    );

    if (!friendByEmail.docs.length) throw new Error('not found');
    const friendIdByEmail = friendByEmail.docs[0].id;
    if (friendIdByEmail === uid) throw new Error('same user');

    return runTransaction(getFirestore(), async (transaction) => {
      transaction.update(doc(usersCollection, uid), {
        friends: arrayUnion({
          confirmed: false,
          requester: doc(usersCollection, uid),
          user: doc(usersCollection, friendIdByEmail),
        }),
      });
      transaction.update(doc(usersCollection, friendIdByEmail), {
        friends: arrayUnion({
          confirmed: false,
          requester: doc(usersCollection, uid),
          user: doc(usersCollection, uid),
        }),
      });
    });
  }

  public static async removeFriend(
    uid: string,
    fid: string,
    requesterId?: string,
  ) {
    const usersCollection = this.getCollection('users');

    return runTransaction(getFirestore(), async (transaction) => {
      const userFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: !requesterId,
        user: doc(usersCollection, fid),
      };
      const friendFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: !requesterId,
        user: doc(usersCollection, uid),
      };

      if (requesterId) {
        userFriend.requester = doc(usersCollection, requesterId);
        friendFriend.requester = doc(usersCollection, requesterId);
      }

      transaction.update(doc(usersCollection, uid), {
        friends: arrayRemove(userFriend),
      });

      transaction.update(doc(usersCollection, fid), {
        friends: arrayRemove(friendFriend),
      });
    });
  }

  public static async confirmFriend(uid: string, fid: string) {
    const usersCollection = this.getCollection('users');
    return runTransaction(getFirestore(), async (transaction) => {
      const userFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: false,
        requester: doc(usersCollection, fid),
        user: doc(usersCollection, fid),
      };
      const friendFriend: {
        confirmed: boolean;
        requester?: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
        user: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>;
      } = {
        confirmed: false,
        requester: doc(usersCollection, fid),
        user: doc(usersCollection, uid),
      };

      // Remove pending request
      transaction.update(doc(usersCollection, uid), {
        friends: arrayRemove(userFriend),
      });

      transaction.update(doc(usersCollection, fid), {
        friends: arrayRemove(friendFriend),
      });

      // Invert
      delete userFriend.requester;
      userFriend.confirmed = true;
      delete friendFriend.requester;
      friendFriend.confirmed = true;

      // Save confirmed request
      transaction.update(doc(usersCollection, uid), {
        friends: arrayUnion(userFriend),
      });

      transaction.update(doc(usersCollection, fid), {
        friends: arrayUnion(friendFriend),
      });
    });
  }

  private static async parseUser(
    uid: string,
    user: UserDoc | undefined,
  ): Promise<User> {
    if (!user) {
      throw new Error(`User document ${uid} does not exist`);
    }

    const parsedFriends: Friend[] = [];

    if (Array.isArray(user.friends)) {
      for (const friend of user.friends) {
        const friendSnap = await friend.user.get();
        const friendData = friendSnap.data();

        if (!friendData) continue;

        parsedFriends.push({
          requester: friend.requester?.id,
          confirmed: friend.confirmed,
          user: {
            type: 'user',
            id: friend.user.id,
            email: friendData.email,
            name: friendData.name,
          },
        });
      }
    }

    return {
      type: 'user',
      id: uid,
      email: user.email,
      name: user.name,
      friends: parsedFriends,
    };
  }
}
