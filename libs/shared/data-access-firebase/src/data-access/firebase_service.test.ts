import { collection, getFirestore } from '@react-native-firebase/firestore';
import { FirebaseService } from './firebase_service';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
}));

describe(FirebaseService.name, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCollection() returns a Firestore collection reference for the provided name', () => {
    const db = { __db: true };
    (getFirestore as jest.Mock).mockReturnValue(db);
    const colRef = { __col: 'users' };
    (collection as jest.Mock).mockReturnValue(colRef);

    const result = FirebaseService.getCollection('users');

    expect(getFirestore).toHaveBeenCalledTimes(1);
    expect(collection).toHaveBeenCalledTimes(1);
    expect(collection).toHaveBeenCalledWith(db, 'users');
    expect(result).toBe(colRef);
  });
});
