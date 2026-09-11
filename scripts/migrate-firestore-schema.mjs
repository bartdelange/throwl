import { readFile } from 'node:fs/promises';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

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
const userIds = new Set(usersSnapshot.docs.map((item) => item.id));
const referenceId = (value) =>
  value && typeof value.path === 'string' && value.path.startsWith('users/')
    ? value.id
    : undefined;

for (const userSnapshot of usersSnapshot.docs) {
  const uid = userSnapshot.id;
  const user = userSnapshot.data();
  const email =
    typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (!email || typeof user.name !== 'string') {
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
  plans.push(['set', db.doc(`publicProfiles/${uid}`), { name: user.name }]);
  plans.push([
    'set',
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
  plans.push(['set', db.doc(`friendships/${id}`), friendship]);
}

for (const gameSnapshot of gamesSnapshot.docs) {
  const game = gameSnapshot.data();
  const playerIds = [
    ...new Set(
      (Array.isArray(game.players) ? game.players : [])
        .map(referenceId)
        .filter(Boolean),
    ),
  ];
  const owner = game.owner ?? ownerMap[gameSnapshot.id];
  if (!owner || !playerIds.includes(owner)) {
    errors.push(
      `games/${gameSnapshot.id} needs an owner-map entry naming a registered player`,
    );
    continue;
  }
  plans.push(['set', gameSnapshot.ref, { owner, playerIds }]);
}

if (phase === 'finalize') {
  for (const userSnapshot of usersSnapshot.docs) {
    plans.push(['update', userSnapshot.ref, { friends: FieldValue.delete() }]);
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

for (let offset = 0; offset < plans.length; offset += 450) {
  const batch = db.batch();
  for (const [operation, reference, data] of plans.slice(
    offset,
    offset + 450,
  )) {
    if (operation === 'update') batch.update(reference, data);
    else batch.set(reference, data, { merge: true });
  }
  await batch.commit();
}
console.log('Migration phase completed. Re-running the same command is safe.');
