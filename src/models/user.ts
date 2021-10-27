import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Friend {
  requester?: string;
  confirmed: boolean;
  user: Omit<User, 'friends'>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  friends?: Friend[];
}
