import { collection, getFirestore } from '@react-native-firebase/firestore';

export class FirebaseService {
    static getCollection(name: string) {
        const db = getFirestore();
        return collection(db, name);
    }
}
