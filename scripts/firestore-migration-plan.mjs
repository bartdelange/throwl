import {
  hasValidPendingRequester,
  legacyRequesterId,
  mergeLegacyFriendship,
} from './firestore-migration-friendships.mjs';

const COLLECTIONS = [
  'users',
  'publicProfiles',
  'userLookups',
  'friendships',
  'games',
  'migrationState',
];

const MIGRATION_STATE_ID = 'throwl-v5';

export const normalizeEmail = (email) => email.trim().toLowerCase();
export const referenceId = (value) =>
  value && typeof value.path === 'string' && /^users\/[^/]+$/.test(value.path)
    ? value.path.slice('users/'.length)
    : undefined;

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const validName = (value) =>
  typeof value === 'string' && value.length > 0 && value.length <= 80;
const validEmail = (value) =>
  typeof value === 'string' &&
  normalizeEmail(value).length > 2 &&
  normalizeEmail(value).length <= 254;

function refFor(state, collection, id) {
  const existing = state[collection].get(id)?.ref;
  if (existing) return existing;
  if (typeof state.referenceFor !== 'function') {
    throw new Error(`No DocumentReference factory for ${collection}/${id}`);
  }
  return state.referenceFor(collection, id);
}

function addPlan(plans, operation, state, collection, id, data, details) {
  plans.push([operation, refFor(state, collection, id), data, details]);
}

function userShape(user) {
  const keys = Object.keys(user).sort();
  if (same(keys, ['email', 'friends', 'name']) && Array.isArray(user.friends)) {
    return 'legacy';
  }
  if (same(keys, ['email', 'name'])) return 'finalized';
  return 'invalid';
}

function normalizedDisposableIdentities(identities = []) {
  return [...identities]
    .map(({ uid, email }) => ({ uid, email: normalizeEmail(email) }))
    .sort((left, right) => left.uid.localeCompare(right.uid));
}

function validateDisposableIdentities(disposableUsers, errors) {
  const seen = new Map();
  for (const { uid, email } of disposableUsers) {
    if (!uid || !validEmail(email)) {
      errors.push('disposable identities must contain a UID and valid email');
      continue;
    }
    if (seen.has(uid)) {
      errors.push(`disposable user ${uid} is configured more than once`);
    }
    seen.set(uid, email);
  }
}

function validateMigrationStateDocuments(state, errors) {
  for (const id of state.migrationState.keys()) {
    if (id !== MIGRATION_STATE_ID) {
      errors.push(`migrationState/${id} is unexpected`);
    }
  }
}

function createExpectedState(
  state,
  disposableUserIds,
  allowedUserShapes = new Set(['legacy']),
) {
  const errors = [];
  const users = new Map();
  const lookupOwners = new Map();
  const friendships = new Map();

  for (const [uid, snapshot] of state.users) {
    const user = snapshot.data;
    if (disposableUserIds.has(uid)) continue;
    const shape = userShape(user);
    if (!allowedUserShapes.has(shape)) {
      errors.push(
        `users/${uid} has unexpected fields or is in the wrong migration phase`,
      );
      continue;
    }
    if (!validEmail(user.email) || !validName(user.name)) {
      errors.push(`users/${uid} is missing a valid email or name`);
      continue;
    }
    const email = normalizeEmail(user.email);
    const duplicate = lookupOwners.get(email);
    if (duplicate && duplicate !== uid) {
      errors.push(
        `users/${uid} has the same normalized email as users/${duplicate}`,
      );
      continue;
    }
    lookupOwners.set(email, uid);
    users.set(uid, { email: user.email, name: user.name, source: user });
  }

  const allUserIds = new Set(state.users.keys());
  const friendshipSides = new Map();
  for (const [uid, user] of users) {
    for (const friend of Array.isArray(user.source.friends)
      ? user.source.friends
      : []) {
      const friendId = referenceId(friend?.user);
      const requester = legacyRequesterId(friend?.requester, referenceId);
      if (friendId && disposableUserIds.has(friendId)) continue;
      if (!friendId || friendId === uid || !allUserIds.has(friendId)) {
        errors.push(`users/${uid} contains an invalid legacy friend reference`);
        continue;
      }
      if (!users.has(friendId)) {
        errors.push(
          `users/${uid} references an unexplained non-legacy user ${friendId}`,
        );
        continue;
      }
      const userIds = [uid, friendId].sort();
      const id = userIds.join('_');
      const sides = friendshipSides.get(id) ?? new Set();
      sides.add(uid);
      friendshipSides.set(id, sides);
      mergeLegacyFriendship(
        friendships,
        id,
        {
          requester: friend.confirmed ? userIds[0] : requester,
          status: friend.confirmed ? 'accepted' : 'pending',
          userIds,
        },
        errors,
      );
    }
  }

  for (const [id, friendship] of friendships) {
    if (!hasValidPendingRequester(friendship)) {
      errors.push(`legacy friendship ${id} has an invalid requester`);
    }
    if (!allowedUserShapes.has('finalized')) {
      const sides = friendshipSides.get(id);
      if (
        !sides ||
        sides.size !== 2 ||
        !friendship.userIds.every((uid) => sides.has(uid))
      ) {
        errors.push(`legacy friendship ${id} is not reciprocal`);
      }
    }
  }

  return { errors, users, lookupOwners, friendships };
}

function canonicalGameFields(id, game, knownUserIds, errors) {
  if (!Array.isArray(game.players)) {
    errors.push(`games/${id} has invalid players`);
    return undefined;
  }
  const playerIds = [];
  for (const player of game.players) {
    if (typeof player === 'string') continue;
    const uid = referenceId(player);
    if (!uid || !knownUserIds.has(uid)) {
      errors.push(`games/${id} has an invalid registered player reference`);
      return undefined;
    }
    playerIds.push(uid);
  }
  if (new Set(playerIds).size !== playerIds.length) {
    errors.push(`games/${id} has a duplicate registered player reference`);
    return undefined;
  }

  let historyUserIds;
  if (game.historyUserIds === undefined) {
    historyUserIds = playerIds;
  } else if (
    !Array.isArray(game.historyUserIds) ||
    game.historyUserIds.some((uid) => typeof uid !== 'string') ||
    new Set(game.historyUserIds).size !== game.historyUserIds.length
  ) {
    errors.push(`games/${id} has invalid historyUserIds`);
    return undefined;
  } else {
    const players = new Set(playerIds);
    historyUserIds = game.historyUserIds.filter((uid) => players.has(uid));
  }

  return { playerIds, historyUserIds };
}

export function planPrepare(state, options = {}) {
  const disposableUserIds = new Set(
    (options.disposableUsers ?? []).map(({ uid }) => uid),
  );
  const expected = createExpectedState(state, disposableUserIds);
  const errors = [...expected.errors];
  const plans = [];

  for (const [uid, user] of expected.users) {
    addPlan(plans, 'replace', state, 'publicProfiles', uid, {
      name: user.name,
    });
    addPlan(
      plans,
      'replace',
      state,
      'userLookups',
      normalizeEmail(user.email),
      { user: refFor(state, 'users', uid) },
    );
  }
  for (const [id, friendship] of expected.friendships) {
    addPlan(plans, 'replace', state, 'friendships', id, friendship);
  }
  const knownUserIds = new Set(state.users.keys());
  for (const [id, snapshot] of state.games) {
    const fields = canonicalGameFields(id, snapshot.data, knownUserIds, errors);
    if (fields) {
      const removedHistoryUserIds = Array.isArray(snapshot.data.historyUserIds)
        ? snapshot.data.historyUserIds.filter(
            (uid) => !fields.historyUserIds.includes(uid),
          )
        : [];
      addPlan(plans, 'merge', state, 'games', id, fields, {
        removedHistoryUserIds,
      });
    }
  }

  return { errors, plans };
}

function friendshipShapeIsValid(id, friendship, users) {
  return (
    friendship &&
    Array.isArray(friendship.userIds) &&
    friendship.userIds.length === 2 &&
    friendship.userIds[0] < friendship.userIds[1] &&
    id === friendship.userIds.join('_') &&
    friendship.userIds.every((uid) => users.has(uid)) &&
    ['pending', 'accepted'].includes(friendship.status) &&
    typeof friendship.requester === 'string' &&
    friendship.userIds.includes(friendship.requester)
  );
}

function disposableGameDisposition(
  id,
  game,
  disposableUserIds,
  deleteGameIds,
  errors,
) {
  const registered = (game.players ?? []).map(referenceId).filter(Boolean);
  const disposablePlayers = registered.filter((uid) =>
    disposableUserIds.has(uid),
  );
  const realPlayers = registered.filter((uid) => !disposableUserIds.has(uid));
  const disposableCreator = disposableUserIds.has(game.createdBy);
  if (deleteGameIds.has(id)) {
    if (!disposableCreator && disposablePlayers.length === 0) {
      errors.push(
        `games/${id} is configured for deletion but has no disposable user`,
      );
      return 'unsafe';
    }
    return 'delete';
  }
  if (!disposableCreator && disposablePlayers.length === 0) return 'keep';
  if (realPlayers.length > 0) {
    errors.push(
      `games/${id} mixes disposable and real users; add its ID to --delete-games after explicit review`,
    );
    return 'unsafe';
  }
  return 'delete';
}

function hasDisposableFirestoreData(state, uid) {
  if (state.publicProfiles.has(uid)) return true;
  if (
    [...state.userLookups.values()].some(
      (snapshot) => referenceId(snapshot.data?.user) === uid,
    )
  ) {
    return true;
  }
  if (
    [...state.friendships.values()].some((snapshot) =>
      snapshot.data?.userIds?.includes(uid),
    )
  ) {
    return true;
  }
  return [...state.games.values()].some(
    (snapshot) =>
      snapshot.data?.createdBy === uid ||
      snapshot.data?.players?.some((player) => referenceId(player) === uid),
  );
}

export function planReconcile(state, options) {
  const disposableUsers = normalizedDisposableIdentities(
    options.disposableUsers,
  );
  const disposableUserIds = new Set(disposableUsers.map(({ uid }) => uid));
  const deleteGameIds = new Set(options.deleteGameIds ?? []);
  if (disposableUserIds.size === 0) {
    return {
      errors: ['reconcile requires at least one explicit disposable user UID'],
      plans: [],
    };
  }

  const expected = createExpectedState(state, disposableUserIds);
  const errors = [...expected.errors];
  const plans = [];
  validateDisposableIdentities(disposableUsers, errors);
  validateMigrationStateDocuments(state, errors);
  const marker = state.migrationState.get(MIGRATION_STATE_ID)?.data;
  const markerMatches =
    marker &&
    ['reconciling', 'reconciled'].includes(marker.phase) &&
    same(marker.disposableUsers, disposableUsers);
  if (marker && !markerMatches) {
    errors.push(
      'existing migration marker does not match this reconciliation run',
    );
  }

  for (const { uid, email } of disposableUsers) {
    const user = state.users.get(uid)?.data;
    if (!user) {
      if (!markerMatches && hasDisposableFirestoreData(state, uid)) {
        errors.push(
          `disposable users/${uid} is missing without a matching in-progress reconciliation marker`,
        );
      }
      continue;
    }
    if (normalizeEmail(user.email ?? '') !== email) {
      errors.push(
        `disposable users/${uid} does not match confirmed email ${email}`,
      );
    }
    if (userShape(user) !== 'finalized') {
      errors.push(
        `disposable users/${uid} is not a canonical-only review/test account`,
      );
    }
  }

  for (const uid of disposableUserIds) {
    if (state.users.has(uid)) addPlan(plans, 'delete', state, 'users', uid);
    if (state.publicProfiles.has(uid)) {
      addPlan(plans, 'delete', state, 'publicProfiles', uid);
    }
  }
  for (const [uid, user] of expected.users) {
    addPlan(plans, 'replace', state, 'publicProfiles', uid, {
      name: user.name,
    });
  }
  for (const [uid] of state.publicProfiles) {
    if (!expected.users.has(uid) && !disposableUserIds.has(uid)) {
      errors.push(`publicProfiles/${uid} belongs to an unexplained user`);
    }
  }

  const expectedLookups = new Map(
    [...expected.lookupOwners].map(([email, uid]) => [
      email,
      { user: refFor(state, 'users', uid) },
    ]),
  );
  for (const [email, data] of expectedLookups) {
    addPlan(plans, 'replace', state, 'userLookups', email, data);
  }
  for (const [email, snapshot] of state.userLookups) {
    const owner = referenceId(snapshot.data?.user);
    if (expectedLookups.has(email)) continue;
    if (!owner || (!state.users.has(owner) && !disposableUserIds.has(owner))) {
      errors.push(`userLookups/${email} points to an unexplained user`);
      continue;
    }
    addPlan(plans, 'delete', state, 'userLookups', email);
  }

  for (const [id, friendship] of expected.friendships) {
    addPlan(plans, 'replace', state, 'friendships', id, friendship);
  }
  for (const [id, snapshot] of state.friendships) {
    if (expected.friendships.has(id)) continue;
    const participants = Array.isArray(snapshot.data?.userIds)
      ? snapshot.data.userIds
      : [];
    if (participants.some((uid) => disposableUserIds.has(uid))) {
      addPlan(plans, 'delete', state, 'friendships', id);
    } else if (
      friendshipShapeIsValid(id, snapshot.data, new Set(expected.users.keys()))
    ) {
      addPlan(plans, 'delete', state, 'friendships', id);
    } else {
      errors.push(`friendships/${id} is unexplained or malformed`);
    }
  }

  const knownUserIds = new Set(state.users.keys());
  for (const [id, snapshot] of state.games) {
    const disposition = disposableGameDisposition(
      id,
      snapshot.data,
      disposableUserIds,
      deleteGameIds,
      errors,
    );
    if (disposition === 'delete') {
      addPlan(plans, 'delete', state, 'games', id);
      continue;
    }
    if (disposition === 'unsafe') continue;
    if (snapshot.data.createdBy !== undefined) {
      errors.push(
        `games/${id} has createdBy from an unlisted pre-cutover v5 user`,
      );
      continue;
    }
    const fields = canonicalGameFields(id, snapshot.data, knownUserIds, errors);
    if (fields) {
      const removedHistoryUserIds = Array.isArray(snapshot.data.historyUserIds)
        ? snapshot.data.historyUserIds.filter(
            (uid) => !fields.historyUserIds.includes(uid),
          )
        : [];
      addPlan(plans, 'merge', state, 'games', id, fields, {
        removedHistoryUserIds,
      });
    }
  }

  addPlan(plans, 'replace', state, 'migrationState', MIGRATION_STATE_ID, {
    phase: 'reconciled',
    disposableUsers,
  });
  if (plans.length > 450) {
    plans.unshift([
      'replace',
      refFor(state, 'migrationState', MIGRATION_STATE_ID),
      { phase: 'reconciling', disposableUsers },
    ]);
  }

  return { errors, plans };
}

export function planFinalize(state, options) {
  const disposableUsers = normalizedDisposableIdentities(
    options.disposableUsers,
  );
  const identityErrors = [];
  validateDisposableIdentities(disposableUsers, identityErrors);
  validateMigrationStateDocuments(state, identityErrors);
  if (identityErrors.length) return { errors: identityErrors, plans: [] };
  const marker = state.migrationState.get(MIGRATION_STATE_ID)?.data;
  const expectedMarkerUsers = JSON.stringify(disposableUsers);
  if (
    !marker ||
    !['reconciled', 'finalized'].includes(marker.phase) ||
    JSON.stringify(marker.disposableUsers) !== expectedMarkerUsers
  ) {
    return {
      errors: [
        'finalize requires the matching completed reconcile migration marker',
      ],
      plans: [],
    };
  }
  const verification = verifyMigrationState(state, {
    ...options,
    finalized: marker.phase === 'finalized',
    allowPartiallyFinalized: marker.phase === 'reconciled',
  });
  if (verification.errors.length) {
    return { errors: verification.errors, plans: [] };
  }
  if (marker.phase === 'finalized') return { errors: [], plans: [] };

  const plans = [];
  for (const [uid, snapshot] of state.users) {
    if (userShape(snapshot.data) === 'finalized') continue;
    addPlan(plans, 'replace', state, 'users', uid, {
      email: snapshot.data.email,
      name: snapshot.data.name,
    });
  }
  addPlan(plans, 'replace', state, 'migrationState', MIGRATION_STATE_ID, {
    phase: 'finalized',
    disposableUsers,
  });
  return { errors: [], plans };
}

export function verifyMigrationState(state, options = {}) {
  const disposableUsers = normalizedDisposableIdentities(
    options.disposableUsers,
  );
  const disposableUserIds = new Set(disposableUsers.map(({ uid }) => uid));
  const allowedUserShapes = options.finalized
    ? new Set(['finalized'])
    : options.allowPartiallyFinalized
      ? new Set(['legacy', 'finalized'])
      : new Set(['legacy']);
  const expected = createExpectedState(
    state,
    disposableUserIds,
    allowedUserShapes,
  );
  const errors = [...expected.errors];
  validateDisposableIdentities(disposableUsers, errors);
  validateMigrationStateDocuments(state, errors);

  const marker = state.migrationState.get(MIGRATION_STATE_ID)?.data;
  if (options.finalized) {
    if (
      marker?.phase !== 'finalized' ||
      JSON.stringify(marker.disposableUsers) !== JSON.stringify(disposableUsers)
    ) {
      errors.push(
        'finalized verification requires the matching finalized marker',
      );
    }
  } else if (marker) {
    if (
      !['reconciled', 'finalized'].includes(marker.phase) ||
      JSON.stringify(marker.disposableUsers) !== JSON.stringify(disposableUsers)
    ) {
      errors.push(
        'migration marker does not match the configured disposable users',
      );
    }
  }

  for (const uid of disposableUserIds) {
    for (const collection of COLLECTIONS.slice(0, 2)) {
      if (state[collection].has(uid)) {
        errors.push(`${collection}/${uid} still contains disposable data`);
      }
    }
  }
  if (options.finalized) {
    for (const [uid, snapshot] of state.users) {
      const keys = Object.keys(snapshot.data).sort();
      if (!same(keys, ['email', 'name'])) {
        errors.push(`users/${uid} is not finalized to exactly email and name`);
      }
    }
  }
  for (const [uid, user] of expected.users) {
    const profile = state.publicProfiles.get(uid)?.data;
    if (!same(profile, { name: user.name })) {
      errors.push(`publicProfiles/${uid} does not match users/${uid}`);
    }
    const lookup = state.userLookups.get(normalizeEmail(user.email))?.data;
    if (referenceId(lookup?.user) !== uid) {
      errors.push(`users/${uid} does not have its correct lookup`);
    }
  }
  for (const [uid] of state.publicProfiles) {
    if (!expected.users.has(uid)) {
      errors.push(`publicProfiles/${uid} is stale or unexplained`);
    }
  }
  for (const [email, snapshot] of state.userLookups) {
    const uid = referenceId(snapshot.data?.user);
    if (!uid || expected.lookupOwners.get(email) !== uid) {
      errors.push(`userLookups/${email} is stale or incorrect`);
    }
  }

  const hasFinalizedUsers = [...expected.users.values()].some(
    ({ source }) => userShape(source) === 'finalized',
  );
  if (!options.finalized && !hasFinalizedUsers) {
    for (const [id, friendship] of expected.friendships) {
      if (!same(state.friendships.get(id)?.data, friendship)) {
        errors.push(
          `friendships/${id} does not match authoritative legacy data`,
        );
      }
    }
  }
  for (const [id, snapshot] of state.friendships) {
    if (
      !friendshipShapeIsValid(id, snapshot.data, new Set(expected.users.keys()))
    ) {
      errors.push(
        `friendships/${id} is malformed or references a missing user`,
      );
    } else if (
      !options.finalized &&
      !hasFinalizedUsers &&
      !expected.friendships.has(id)
    ) {
      errors.push(`friendships/${id} is unexpected`);
    }
  }

  const knownUserIds = new Set(expected.users.keys());
  for (const [id, snapshot] of state.games) {
    const game = snapshot.data;
    const registered = (game.players ?? []).map(referenceId).filter(Boolean);
    if (registered.some((uid) => disposableUserIds.has(uid))) {
      errors.push(`games/${id} still references a disposable user`);
    }
    if (disposableUserIds.has(game.createdBy)) {
      errors.push(`games/${id} was created by a disposable user`);
    }
    if (
      game.createdBy !== undefined &&
      (typeof game.createdBy !== 'string' || !knownUserIds.has(game.createdBy))
    ) {
      errors.push(`games/${id} has an invalid createdBy`);
    }
    const fields = canonicalGameFields(id, game, knownUserIds, errors);
    if (!fields) continue;
    if (!same(game.playerIds, fields.playerIds)) {
      errors.push(`games/${id} has incorrect playerIds`);
    }
    if (!same(game.historyUserIds, fields.historyUserIds)) {
      errors.push(`games/${id} has invalid historyUserIds`);
    }
  }

  return { errors };
}

export function createEmptyMigrationState(referenceFor) {
  const state = Object.fromEntries(
    COLLECTIONS.map((name) => [name, new Map()]),
  );
  state.referenceFor = referenceFor;
  return state;
}
