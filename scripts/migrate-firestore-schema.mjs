import { readFile } from 'node:fs/promises';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { commitMigrationPlans } from './firestore-migration-operations.mjs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === '--') continue;
  if (argument === '--apply') args.set('apply', true);
  else if (argument.startsWith('--'))
    args.set(argument.slice(2), process.argv[++index]);
}

const projectId = args.get('project');
const phase = args.get('phase') ?? 'backfill';
const apply = args.get('apply') === true;
if (!projectId || !['backfill', 'finalize'].includes(phase)) {
  console.error(
    'Usage: pnpm migrate:firestore -- --project <id> [--phase backfill|finalize] [--owner-map <json>] [--apply]',
  );
  process.exit(2);
}

const ownerMap = args.get('owner-map')
  ? JSON.parse(await readFile(args.get('owner-map'), 'utf8'))
  : {};
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const [usersSnapshot, gamesSnapshot] = await Promise.all([
  db.collection('users').get(),
  db.collection('games').get(),
]);

const plans = [];
const errors = [];
const lookupOwners = new Map();
const friendships = new Map();
const canonicalUsers = new Map();
const userIds = new Set(usersSnapshot.docs.map((item) => item.id));
const referenceId = (value) =>
  value && typeof value.path === 'string' && /^users\/[^/]+$/.test(value.path)
    ? value.id
    : undefined;

for (const userSnapshot of usersSnapshot.docs) {
  const uid = userSnapshot.id;
  const user = userSnapshot.data();
  const email =
    typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (
    !email ||
    email.length > 254 ||
    typeof user.name !== 'string' ||
    user.name.length === 0 ||
    user.name.length > 80
  ) {
    errors.push(`users/${uid} is missing a valid email or name`);
    continue;
  }
  const duplicate = lookupOwners.get(email);
  if (duplicate && duplicate !== uid) {
    errors.push(
      `users/${uid} has the same normalized email as users/${duplicate}`,
    );
  }
  lookupOwners.set(email, uid);
  canonicalUsers.set(uid, { email: user.email, name: user.name });
  plans.push(['replace', db.doc(`publicProfiles/${uid}`), { name: user.name }]);
  plans.push([
    'replace',
    db.doc(`userLookups/${email}`),
    { user: userSnapshot.ref },
  ]);

  for (const friend of Array.isArray(user.friends) ? user.friends : []) {
    const friendId = referenceId(friend.user);
    const requester = referenceId(friend.requester);
    if (!friendId || friendId === uid || !userIds.has(friendId)) {
      errors.push(`users/${uid} contains an invalid legacy friend reference`);
      continue;
    }
    const pair = [uid, friendId].sort();
    const id = pair.join('_');
    const candidate = {
      // Accepted legacy entries no longer retain their requester. The field is
      // authorization-irrelevant after acceptance, so use a stable member.
      requester: friend.confirmed ? pair[0] : requester,
      status: friend.confirmed ? 'accepted' : 'pending',
      userIds: pair,
    };
    const prior = friendships.get(id);
    if (
      prior &&
      (prior.status !== candidate.status ||
        prior.requester !== candidate.requester)
    ) {
      errors.push(
        `legacy friendship ${id} is inconsistent between user documents`,
      );
    } else {
      friendships.set(id, candidate);
    }
  }
}

for (const [id, friendship] of friendships) {
  if (
    friendship.status === 'pending' &&
    !friendship.userIds.includes(friendship.requester)
  ) {
    errors.push(`legacy friendship ${id} has an invalid requester`);
    continue;
  }
  plans.push(['replace', db.doc(`friendships/${id}`), friendship]);
}

for (const gameSnapshot of gamesSnapshot.docs) {
  const game = gameSnapshot.data();
  const players = Array.isArray(game.players) ? game.players : [];
  const playerKeys = players.map((player) =>
    typeof player === 'string'
      ? `guest:${player}`
      : `ref:${player?.path ?? ''}`,
  );
  const playerIds = [...new Set(players.map(referenceId).filter(Boolean))];
  const owner = game.owner ?? ownerMap[gameSnapshot.id];
  const malformedPlayer = players.some(
    (player) =>
      !referenceId(player) &&
      (typeof player !== 'string' || player.length === 0 || player.length > 80),
  );
  if (
    players.length === 0 ||
    players.length > 16 ||
    playerIds.length > 10 ||
    new Set(playerKeys).size !== playerKeys.length ||
    malformedPlayer
  ) {
    errors.push(`games/${gameSnapshot.id} has invalid or duplicate players`);
    continue;
  }
  if (!owner || !playerIds.includes(owner)) {
    errors.push(
      `games/${gameSnapshot.id} needs an owner-map entry naming a registered player`,
    );
    continue;
  }
  plans.push(['merge', gameSnapshot.ref, { owner, playerIds }]);
}

if (phase === 'finalize') {
  for (const userSnapshot of usersSnapshot.docs) {
    const canonicalUser = canonicalUsers.get(userSnapshot.id);
    if (canonicalUser) plans.push(['replace', userSnapshot.ref, canonicalUser]);
  }
}

console.log(
  `${apply ? 'APPLY' : 'DRY RUN'} ${phase}: ${usersSnapshot.size} users, ${gamesSnapshot.size} games, ${friendships.size} friendships, ${plans.length} writes`,
);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
if (!apply) process.exit(0);

await commitMigrationPlans(db, plans);
console.log('Migration phase completed. Re-running the same command is safe.');
