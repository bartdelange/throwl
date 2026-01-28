/**
 * UserService – happy flow tests
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';

import { FirebaseService } from './firebase_service';
import { UserService } from './user_service';

jest.mock('@react-native-firebase/firestore', () => ({
  doc: jest.fn((col: unknown, id: string) => ({ __doc: true, col, id })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  arrayUnion: jest.fn((...vals: unknown[]) => ({ __arrayUnion: vals })),
  arrayRemove: jest.fn((...vals: unknown[]) => ({ __arrayRemove: vals })),
  getFirestore: jest.fn(() => ({ __db: true })),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  runTransaction: jest.fn(),
}));

describe('UserService (happy flows)', () => {
  const mockUsersCollection = { __collection: 'users' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest
      .spyOn(FirebaseService, 'getCollection')
      .mockReturnValue(mockUsersCollection);
  });

  it('create() writes a new user document and returns getById(uid)', async () => {
    const getByIdSpy = jest.spyOn(UserService, 'getById').mockResolvedValue({
      type: 'user',
      id: 'u1',
      email: 'a@b.com',
      name: 'Bart',
      friends: [],
    });

    const result = await UserService.create('u1', 'a@b.com', 'Bart');

    expect(FirebaseService.getCollection).toHaveBeenCalledWith('users');
    expect(doc).toHaveBeenCalledWith(mockUsersCollection, 'u1');
    expect(setDoc).toHaveBeenCalledTimes(1);

    const [userRef, payload] = (setDoc as jest.Mock).mock.calls[0];
    expect(userRef).toMatchObject({ __doc: true, id: 'u1' });
    expect(payload).toEqual({
      email: 'a@b.com',
      name: 'Bart',
      friends: [],
    });

    expect(getByIdSpy).toHaveBeenCalledWith('u1');
    expect(result).toEqual({
      type: 'user',
      id: 'u1',
      email: 'a@b.com',
      name: 'Bart',
      friends: [],
    });
  });

  it('getById() returns parsed user when document exists and has no friends', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'x@y.com',
        name: 'X',
        friends: undefined,
      }),
    });

    const result = await UserService.getById('u42');

    expect(doc).toHaveBeenCalledWith(mockUsersCollection, 'u42');
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      type: 'user',
      id: 'u42',
      email: 'x@y.com',
      name: 'X',
      friends: [],
    });
  });

  it('updateEmail() patches only the email field', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await UserService.updateEmail('u1', 'new@mail.com');

    expect(FirebaseService.getCollection).toHaveBeenCalledWith('users');
    expect(doc).toHaveBeenCalledWith(mockUsersCollection, 'u1');
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      { email: 'new@mail.com' },
    );
  });

  it('updateName() patches only the name field', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await UserService.updateName('u1', 'New Name');

    expect(FirebaseService.getCollection).toHaveBeenCalledWith('users');
    expect(doc).toHaveBeenCalledWith(mockUsersCollection, 'u1');
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      { name: 'New Name' },
    );
  });
});
