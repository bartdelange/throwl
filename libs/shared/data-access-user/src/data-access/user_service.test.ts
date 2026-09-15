/**
 * UserService – happy flow tests
 */
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import { FirebaseService } from '@throwl/shared-data-access-firebase';
import { UserService } from './user_service';

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = {
    collection: jest.fn((_db: unknown, name: string) => ({
      __collection: { db: _db, name },
    })),
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
    writeBatch: jest.fn(),
  };
  return mockFirestore;
});

const mockFirestore = jest.requireMock('@react-native-firebase/firestore');

describe('UserService (happy flows)', () => {
  const mockUsersCollection = mockFirestore.collection(
    mockFirestore.getFirestore(),
    'users',
  );
  const batch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (writeBatch as jest.Mock).mockReturnValue(batch);
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

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
    expect(batch.set).toHaveBeenCalledTimes(3);
    expect(batch.set).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      { email: 'a@b.com', name: 'Bart' },
    );
    expect(batch.commit).toHaveBeenCalled();

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
    await UserService.updateEmail('u1', 'old@mail.com', 'new@mail.com');

    expect(FirebaseService.getCollection).toHaveBeenCalledWith('users');
    expect(doc).toHaveBeenCalledWith(mockUsersCollection, 'u1');
    expect(batch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      { email: 'new@mail.com' },
    );
    expect(batch.delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'old@mail.com' }),
    );
  });

  it('updateName() patches only the name field', async () => {
    await UserService.updateName('u1', 'New Name');

    expect(FirebaseService.getCollection).toHaveBeenCalledWith('users');
    expect(doc).toHaveBeenCalledWith(mockUsersCollection, 'u1');
    expect(batch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      { name: 'New Name' },
    );
    expect(batch.update).toHaveBeenCalledTimes(2);
  });

  it('creates friendships with canonical sorted participant IDs', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      data: () => ({ user: { id: 'alice' } }),
    });

    await UserService.addFriend('zoe', 'alice@example.test');

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'alice_zoe' }),
      {
        requester: 'zoe',
        status: 'pending',
        userIds: ['alice', 'zoe'],
      },
    );
  });
});
