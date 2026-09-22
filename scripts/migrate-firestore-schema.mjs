import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  commitMigrationPlans,
  summarizeMigrationPlans,
} from './firestore-migration-operations.mjs';
import {
  planFinalize,
  planPrepare,
  planReconcile,
  verifyMigrationState,
} from './firestore-migration-plan.mjs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === '--') continue;
  if (argument === '--apply' || argument === '--finalized') {
    args.set(argument.slice(2), true);
  } else if (argument.startsWith('--')) {
    args.set(argument.slice(2), process.argv[++index]);
  }
}

const splitList = (value) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const parseDisposableUsers = (value) =>
  splitList(value).map((identity) => {
    const separator = identity.indexOf('=');
    if (separator <= 0 || separator === identity.length - 1) {
      throw new Error(
        `Invalid disposable identity "${identity}"; expected UID=email`,
      );
    }
    return {
      uid: identity.slice(0, separator),
      email: identity.slice(separator + 1),
    };
  });

const projectId = args.get('project');
const phase = args.get('phase');
const apply = args.get('apply') === true;
let disposableUsers;
try {
  disposableUsers = parseDisposableUsers(args.get('disposable-users'));
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
const deleteGameIds = splitList(args.get('delete-games'));
const phases = ['prepare', 'reconcile', 'finalize', 'verify'];
if (!projectId || !phases.includes(phase)) {
  console.error(
    'Usage: pnpm migrate:firestore -- --project <id> --phase prepare|reconcile|finalize|verify [--disposable-users UID=email,UID=email] [--delete-games id,id] [--finalized] [--apply]',
  );
  process.exit(2);
}
if (apply && phase === 'verify') {
  console.error('verify is read-only and does not accept --apply');
  process.exit(2);
}
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const collectionNames = [
  'users',
  'publicProfiles',
  'userLookups',
  'friendships',
  'games',
  'migrationState',
];
const snapshots = await Promise.all(
  collectionNames.map((name) => db.collection(name).get()),
);
const state = Object.fromEntries(
  snapshots.map((snapshot, index) => [
    collectionNames[index],
    new Map(
      snapshot.docs.map((item) => [
        item.id,
        { ref: item.ref, data: item.data() },
      ]),
    ),
  ]),
);
state.referenceFor = (collection, id) => db.doc(`${collection}/${id}`);
const options = {
  disposableUsers,
  deleteGameIds,
  finalized: args.get('finalized') === true,
};

let result;
if (phase === 'prepare') result = planPrepare(state, options);
else if (phase === 'reconcile') result = planReconcile(state, options);
else if (phase === 'finalize') result = planFinalize(state, options);
else result = verifyMigrationState(state, options);

if (result.errors.length) {
  for (const error of result.errors) console.error(`ERROR: ${error}`);
  console.error(
    `${phase.toUpperCase()} FAILED: ${result.errors.length} error(s)`,
  );
  process.exit(1);
}

if (phase === 'verify') {
  console.log(
    `VERIFY OK (${options.finalized ? 'finalized' : 'legacy-authoritative'} state)`,
  );
  process.exit(0);
}

const summary = summarizeMigrationPlans(result.plans);
console.log(
  `${apply ? 'APPLY' : 'DRY RUN'} ${phase}: ${JSON.stringify(summary)}`,
);
for (const [operation, reference, , details] of result.plans) {
  console.log(`${operation.toUpperCase()} ${reference.path}`);
  if (details?.removedHistoryUserIds?.length) {
    console.log(
      `  REMOVE historyUserIds: ${details.removedHistoryUserIds.join(', ')}`,
    );
  }
}
if (!apply) process.exit(0);

await commitMigrationPlans(db, result.plans);
console.log(`${phase} writes completed. Run verify before continuing.`);
if (phase === 'reconcile' && disposableUsers.length) {
  console.warn(
    `MANUAL AUTH CLEANUP REQUIRED for disposable UIDs: ${disposableUsers.map(({ uid }) => uid).join(', ')}`,
  );
}
