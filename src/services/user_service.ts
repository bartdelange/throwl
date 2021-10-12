import firestore from '@react-native-firebase/firestore';
import { Service } from '~/services/service';
import { User } from '~/models/user';

export class UserService implements Service<User> {
  public create(uid: string, set: any): Promise<User> {
    return Promise.resolve(undefined) as unknown as Promise<User>;
  }

  public async getById(uid: string): Promise<User> {
    const userDoc = await firestore().collection('users').doc(uid).get();

    return userDoc.data() as User;
  }

  public update(uid: string, set: any): Promise<User> {
    return Promise.resolve(undefined) as unknown as Promise<User>;
  }

  public delete(uid: string): Promise<User> {
    return Promise.resolve(undefined) as unknown as Promise<User>;
  }
}
