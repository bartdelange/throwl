import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  hasValidPendingRequester,
  legacyRequesterId,
  mergeLegacyFriendship,
} from './firestore-migration-friendships.mjs';

const referenceId = (value) =>
  value && typeof value.path === 'string' && /^users\/[^/]+$/.test(value.path)
    ? value.path.slice('users/'.length)
    : undefined;

describe('legacy friendship requester parsing', () => {
  test('accepts a users DocumentReference representation', () => {
    assert.equal(
      legacyRequesterId({ path: 'users/alice' }, referenceId),
      'alice',
    );
  });

  test('accepts an equivalent UID-string representation', () => {
    assert.equal(legacyRequesterId('alice', referenceId), 'alice');
  });

  test('rejects an unrelated requester UID', () => {
    assert.equal(
      hasValidPendingRequester({
        requester: legacyRequesterId('mallory', referenceId),
        status: 'pending',
        userIds: ['alice', 'bob'],
      }),
      false,
    );
  });
});

describe('reviewed legacy friendship resolutions', () => {
  test('resolves the exact reviewed contradiction as accepted', () => {
    const id = '5maRY5Uz7RfUkpvLOgYr39Hy7mJ2_eA5aK8DG9ybf5xIawEjqJh0LTXG3';
    const friendships = new Map([
      [
        id,
        {
          requester: '5maRY5Uz7RfUkpvLOgYr39Hy7mJ2',
          status: 'accepted',
          userIds: id.split('_'),
        },
      ],
    ]);
    const errors = [];

    mergeLegacyFriendship(
      friendships,
      id,
      {
        requester: 'eA5aK8DG9ybf5xIawEjqJh0LTXG3',
        status: 'pending',
        userIds: id.split('_'),
      },
      errors,
    );

    assert.deepEqual(friendships.get(id), {
      requester: '5maRY5Uz7RfUkpvLOgYr39Hy7mJ2',
      status: 'accepted',
      userIds: id.split('_'),
    });
    assert.deepEqual(errors, []);
  });

  test('continues to reject every other contradiction', () => {
    const id = 'alice_bob';
    const accepted = {
      requester: 'alice',
      status: 'accepted',
      userIds: ['alice', 'bob'],
    };
    const friendships = new Map([[id, accepted]]);
    const errors = [];

    mergeLegacyFriendship(
      friendships,
      id,
      {
        requester: 'bob',
        status: 'pending',
        userIds: ['alice', 'bob'],
      },
      errors,
    );

    assert.deepEqual(friendships.get(id), accepted);
    assert.deepEqual(errors, [
      'legacy friendship alice_bob is inconsistent between user documents',
    ]);
  });
});
