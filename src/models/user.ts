import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import DocumentReference = FirebaseFirestoreTypes.DocumentReference;

export interface User {
  email: string;
  name: string;
  friends: {
    requester: DocumentReference;
    confirmed: boolean;
    user: DocumentReference;
  }[];
}
