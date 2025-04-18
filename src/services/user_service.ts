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
import { Friend, User } from '~/models/user';
import { FirebaseService } from '~/services/firebase_service.ts';

export class UserService extends FirebaseService {
    public static listenToUserChanges(
        uid: string,
        onNext: (snapshot: User) => void,
        onError?: (error: Error) => void,
        onCompletion?: () => void
    ) {
        const usersCollection = this.getCollection('users');
        return onSnapshot(
            doc(usersCollection, uid),
            async data => {
                const userData = data.data() as Omit<User, 'id'>;
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
        const usersCollection = this.getCollection('users');
        await setDoc(doc(usersCollection, uid), {
            email,
            name,
            friends: [],
        });
        return await this.getById(uid);
    }

    public static async getById(uid: string): Promise<User> {
        const userDoc = await getDoc(doc(this.getCollection('users'), uid));

        return this.parseUser(uid, userDoc.data());
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
        let friendByEmail = await getDocs(
            query(usersCollection, where('email', '==', friendEmail), limit(1))
        );

        if (!friendByEmail.docs.length) throw 'not found';
        const friendIdByEmail = friendByEmail.docs[0].id;
        if (friendIdByEmail == uid) throw 'same user';

        return runTransaction(getFirestore(), async transaction => {
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
        requesterId?: string
    ) {
        const usersCollection = this.getCollection('users');

        return runTransaction(getFirestore(), async transaction => {
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

            if (!!requesterId) {
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
        return runTransaction(getFirestore(), async transaction => {
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

    private static async parseUser(uid: string, user: any): Promise<User> {
        const parsedFriends: Friend[] = [];
        if (user.friends && Array.isArray(user.friends)) {
            for (const friend of user.friends) {
                const friendData = (await friend.user.get()).data();
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
