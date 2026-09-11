import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  writeBatch,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { Friend, User } from '@throwl/shared-domain-models';
import { FirebaseService } from '@throwl/shared-data-access-firebase';

type UserDoc = {
  email: string;
  name: string;
};

type FriendshipDoc = {
  requester: string;
  status: 'pending' | 'accepted';
  userIds: string[];
};
type PublicProfileDoc = { name: string };
type LookupDoc = { user?: { id?: string } };

export class UserService extends FirebaseService {
  public static listenToUserChanges(
    uid: string,
    onNext: (snapshot: User) => void,
    onError?: (error: Error) => void,
    onCompletion?: () => void,
  ) {
    const usersCollection = this.getCollection('users');
    const refresh = async () => onNext(await this.getById(uid));
    const unsubscribeUser = onSnapshot(
      doc(usersCollection, uid),
      refresh,
      onError,
      onCompletion,
    );
    const unsubscribeFriends = onSnapshot(
      query(
        this.getCollection('friendships'),
        where('userIds', 'array-contains', uid),
      ),
      refresh,
      onError,
    );
    return () => {
      unsubscribeUser();
      unsubscribeFriends();
    };
  }

  public static async create(
    uid: string,
    email: string,
    name: string,
  ): Promise<User> {
    const usersCollection = this.getCollection('users');
    const db = getFirestore();
    const batch = writeBatch(db);
    batch.set(doc(usersCollection, uid), { email, name });
    batch.set(doc(this.getCollection('publicProfiles'), uid), { name });
    batch.set(doc(this.getCollection('userLookups'), this.lookupKey(email)), {
      user: doc(usersCollection, uid),
    });
    await batch.commit();
    return await this.getById(uid);
  }

  public static async getById(uid: string): Promise<User> {
    const uDoc = doc(this.getCollection('users'), uid);
    const userDoc = await getDoc(uDoc);

    return this.parseUser(uid, userDoc.data() as UserDoc | undefined);
  }

  public static async getPublicById(
    uid: string,
  ): Promise<Omit<User, 'friends'>> {
    const profile = await getDoc(
      doc(this.getCollection('publicProfiles'), uid),
    );
    const data = profile.data() as PublicProfileDoc | undefined;
    if (!data) throw new Error(`Public profile ${uid} does not exist`);
    return { type: 'user', id: uid, email: '', name: data.name };
  }

  public static async updateEmail(
    uid: string,
    oldEmail: string,
    email: string,
  ) {
    const db = getFirestore();
    const usersCollection = this.getCollection('users');
    const batch = writeBatch(db);
    batch.update(doc(usersCollection, uid), { email });
    batch.delete(
      doc(this.getCollection('userLookups'), this.lookupKey(oldEmail)),
    );
    batch.set(doc(this.getCollection('userLookups'), this.lookupKey(email)), {
      user: doc(usersCollection, uid),
    });
    await batch.commit();
  }

  public static async updateName(uid: string, name: string) {
    const batch = writeBatch(getFirestore());
    batch.update(doc(this.getCollection('users'), uid), { name });
    batch.update(doc(this.getCollection('publicProfiles'), uid), { name });
    await batch.commit();
  }

  public static async addFriend(uid: string, friendEmail: string) {
    const lookup = await getDoc(
      doc(this.getCollection('userLookups'), this.lookupKey(friendEmail)),
    );
    const friendIdByEmail = (lookup.data() as LookupDoc | undefined)?.user?.id;
    if (!friendIdByEmail) throw new Error('not found');
    if (friendIdByEmail === uid) throw new Error('same user');
    const userIds = [uid, friendIdByEmail].sort();
    return setDoc(
      doc(
        this.getCollection('friendships'),
        this.friendshipId(uid, friendIdByEmail),
      ),
      {
        requester: uid,
        status: 'pending',
        userIds,
      },
    );
  }

  public static async removeFriend(
    uid: string,
    fid: string,
    _requesterId?: string,
  ) {
    return deleteDoc(
      doc(this.getCollection('friendships'), this.friendshipId(uid, fid)),
    );
  }

  public static async confirmFriend(uid: string, fid: string) {
    return updateDoc(
      doc(this.getCollection('friendships'), this.friendshipId(uid, fid)),
      {
        status: 'accepted',
      },
    );
  }

  private static async parseUser(
    uid: string,
    user: UserDoc | undefined,
  ): Promise<User> {
    if (!user) {
      throw new Error(`User document ${uid} does not exist`);
    }

    const parsedFriends: Friend[] = [];
    const friendships = await getDocs(
      query(
        this.getCollection('friendships'),
        where('userIds', 'array-contains', uid),
      ),
    );
    for (const friendshipSnap of friendships.docs) {
      const friendship = friendshipSnap.data() as FriendshipDoc;
      const friendId = friendship.userIds.find(
        (candidate) => candidate !== uid,
      );
      if (!friendId) continue;
      const profile = await getDoc(
        doc(this.getCollection('publicProfiles'), friendId),
      );
      const friendData = profile.data() as PublicProfileDoc | undefined;
      if (!friendData) continue;
      parsedFriends.push({
        requester:
          friendship.status === 'pending' ? friendship.requester : undefined,
        confirmed: friendship.status === 'accepted',
        user: { type: 'user', id: friendId, email: '', name: friendData.name },
      });
    }

    return {
      type: 'user',
      id: uid,
      email: user.email,
      name: user.name,
      friends: parsedFriends,
    };
  }

  private static lookupKey(email: string) {
    return email.trim().toLowerCase();
  }

  private static friendshipId(left: string, right: string) {
    return [left, right].sort().join('_');
  }
}
