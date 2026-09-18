import { pathToFileURL } from 'node:url';
import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from 'firebase-admin/app';
import {
  DocumentReference,
  GeoPoint,
  Timestamp,
  getFirestore,
} from 'firebase-admin/firestore';

export const SOURCE_PROJECT = 'darts-counter-b73d6';
export const TARGET_PROJECT = 'throwl-dev';

const SOURCE_APP_NAME = 'throwl-firestore-clone-source-read-only';
const TARGET_APP_NAME = 'throwl-firestore-clone-target-write-only';
const VERIFY_BATCH_SIZE = 100;
const PROGRESS_INTERVAL = 100;

function validateSafetyConstants() {
  if (
    SOURCE_PROJECT !== 'darts-counter-b73d6' ||
    TARGET_PROJECT !== 'throwl-dev' ||
    SOURCE_PROJECT === TARGET_PROJECT
  ) {
    throw new Error(
      'Safety check failed: the hardcoded source and target project IDs are invalid.',
    );
  }
}

function parseArguments(argv) {
  const args = argv.filter((argument) => argument !== '--');
  const unknown = args.filter((argument) => argument !== '--execute');
  if (unknown.length > 0) {
    throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  }
  return { execute: args.includes('--execute') };
}

function createInventory() {
  return {
    documents: [],
    documentCounts: new Map(),
    referenceCount: 0,
    referenceDocumentPaths: new Set(),
    referenceProjects: new Set(),
    nativeTypes: new Set(),
    unsupportedTypes: new Set(),
    readErrors: [],
  };
}

function referenceProjectId(reference) {
  const direct =
    reference.firestore?.projectId ?? reference._firestore?.projectId;
  if (typeof direct === 'string') return direct;
  const match = /^projects\/([^/]+)\//.exec(reference.toString());
  return match?.[1] ?? 'unknown';
}

export function remapFirestoreValue(value, targetDb, inventory, documentPath) {
  if (value === null) {
    inventory.nativeTypes.add('null');
    return null;
  }

  if (value instanceof DocumentReference) {
    inventory.nativeTypes.add('DocumentReference');
    inventory.referenceCount += 1;
    inventory.referenceDocumentPaths.add(documentPath);
    inventory.referenceProjects.add(referenceProjectId(value));
    return targetDb.doc(value.path);
  }

  if (value instanceof Timestamp) {
    inventory.nativeTypes.add('Timestamp');
    return value;
  }
  if (value instanceof GeoPoint) {
    inventory.nativeTypes.add('GeoPoint');
    return value;
  }
  if (Buffer.isBuffer(value)) {
    inventory.nativeTypes.add('Bytes');
    return Buffer.from(value);
  }
  if (value instanceof Uint8Array) {
    inventory.nativeTypes.add('Bytes');
    return new Uint8Array(value);
  }
  if (value instanceof Date) {
    inventory.nativeTypes.add('Date');
    return new Date(value.getTime());
  }
  if (Array.isArray(value)) {
    inventory.nativeTypes.add('array');
    return value.map((item) =>
      remapFirestoreValue(item, targetDb, inventory, documentPath),
    );
  }

  const primitiveType = typeof value;
  if (
    primitiveType === 'string' ||
    primitiveType === 'number' ||
    primitiveType === 'boolean'
  ) {
    inventory.nativeTypes.add(primitiveType);
    return value;
  }

  if (primitiveType === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      inventory.nativeTypes.add('map');
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          remapFirestoreValue(item, targetDb, inventory, documentPath),
        ]),
      );
    }

    const typeName = value.constructor?.name ?? 'unknown object';
    if (typeName === 'VectorValue') {
      inventory.nativeTypes.add('VectorValue');
      return value;
    }
    inventory.unsupportedTypes.add(typeName);
    return value;
  }

  inventory.unsupportedTypes.add(primitiveType);
  return value;
}

async function inventoryCollection(
  collection,
  topLevelCollection,
  targetDb,
  inventory,
) {
  let documentReferences;
  try {
    documentReferences = await collection.listDocuments();
  } catch (error) {
    inventory.readErrors.push(`${collection.path}: ${error.message}`);
    return;
  }

  for (const sourceReference of documentReferences) {
    let snapshot;
    try {
      snapshot = await sourceReference.get();
    } catch (error) {
      inventory.readErrors.push(`${sourceReference.path}: ${error.message}`);
      continue;
    }

    if (snapshot.exists) {
      const data = remapFirestoreValue(
        snapshot.data(),
        targetDb,
        inventory,
        sourceReference.path,
      );
      inventory.documents.push({ path: sourceReference.path, data });
      inventory.documentCounts.set(
        topLevelCollection,
        (inventory.documentCounts.get(topLevelCollection) ?? 0) + 1,
      );
      if (inventory.documents.length % PROGRESS_INTERVAL === 0) {
        console.log(`Inventoried ${inventory.documents.length} documents...`);
      }
    }

    let childCollections;
    try {
      childCollections = await sourceReference.listCollections();
    } catch (error) {
      inventory.readErrors.push(`${sourceReference.path}: ${error.message}`);
      continue;
    }
    for (const childCollection of childCollections) {
      await inventoryCollection(
        childCollection,
        topLevelCollection,
        targetDb,
        inventory,
      );
    }
  }
}

async function buildInventory(sourceDb, targetDb) {
  const inventory = createInventory();
  let topLevelCollections = [];
  try {
    topLevelCollections = await sourceDb.listCollections();
  } catch (error) {
    inventory.readErrors.push(`top-level collections: ${error.message}`);
  }

  topLevelCollections.sort((left, right) => left.id.localeCompare(right.id));
  for (const collection of topLevelCollections) {
    inventory.documentCounts.set(collection.id, 0);
    await inventoryCollection(collection, collection.id, targetDb, inventory);
  }
  return { topLevelCollections, inventory };
}

function printInventory(topLevelCollections, inventory, execute) {
  console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY RUN (zero writes)'}`);
  console.log(`Source project (read only): ${SOURCE_PROJECT}`);
  console.log(`Target project: ${TARGET_PROJECT}`);
  console.log(
    `Top-level collections: ${topLevelCollections.map(({ id }) => id).join(', ') || '(none)'}`,
  );
  for (const { id } of topLevelCollections) {
    console.log(
      `  ${id}: ${inventory.documentCounts.get(id)} documents (including descendants)`,
    );
  }
  console.log(`Total documents: ${inventory.documents.length}`);
  console.log(`DocumentReference values: ${inventory.referenceCount}`);
  console.log(
    `Documents containing references: ${inventory.referenceDocumentPaths.size}`,
  );
  console.log(
    `Reference source projects: ${[...inventory.referenceProjects].sort().join(', ') || '(none)'}`,
  );
  console.log(
    `Discovered Firestore value types: ${[...inventory.nativeTypes].sort().join(', ') || '(none)'}`,
  );
  console.log(
    `Unsupported value types: ${[...inventory.unsupportedTypes].sort().join(', ') || '(none)'}`,
  );
  console.log(`Source read errors: ${inventory.readErrors.length}`);
  for (const error of inventory.readErrors)
    console.error(`  READ ERROR: ${error}`);
}

async function writeDocuments(targetDb, documents) {
  const writer = targetDb.bulkWriter();
  const failures = [];
  let completed = 0;
  writer.onWriteError((error) => {
    if (error.failedAttempts < 3) return true;
    failures.push(`${error.documentRef.path}: ${error.message}`);
    return false;
  });
  writer.onWriteResult(() => {
    completed += 1;
    if (completed % PROGRESS_INTERVAL === 0 || completed === documents.length) {
      console.log(`Copied ${completed}/${documents.length} documents...`);
    }
  });
  for (const document of documents) {
    writer.set(targetDb.doc(document.path), document.data);
  }
  await writer.close();
  return failures;
}

async function verifyCopy(targetDb, documents) {
  const missingPaths = [];
  const sourceReferences = [];
  const unexpectedReferenceProjects = [];
  let found = 0;

  for (let offset = 0; offset < documents.length; offset += VERIFY_BATCH_SIZE) {
    const batch = documents.slice(offset, offset + VERIFY_BATCH_SIZE);
    const snapshots = await targetDb.getAll(
      ...batch.map(({ path }) => targetDb.doc(path)),
    );
    for (const snapshot of snapshots) {
      if (!snapshot.exists) {
        missingPaths.push(snapshot.ref.path);
        continue;
      }
      found += 1;
      const check = createInventory();
      remapFirestoreValue(snapshot.data(), targetDb, check, snapshot.ref.path);
      if (check.referenceProjects.has(SOURCE_PROJECT)) {
        sourceReferences.push(snapshot.ref.path);
      }
      for (const project of check.referenceProjects) {
        if (project !== TARGET_PROJECT) {
          unexpectedReferenceProjects.push(`${snapshot.ref.path}: ${project}`);
        }
      }
    }
  }

  console.log(`Verification expected paths: ${documents.length}`);
  console.log(`Verification existing target paths: ${found}`);
  console.log(`Verification missing paths: ${missingPaths.length}`);
  console.log(
    `Verification documents still referencing source: ${sourceReferences.length}`,
  );
  if (missingPaths.length > 0) {
    console.error(`Missing target paths: ${missingPaths.join(', ')}`);
  }
  if (unexpectedReferenceProjects.length > 0) {
    console.error(
      `Unexpected target reference projects: ${unexpectedReferenceProjects.join(', ')}`,
    );
  }
  return (
    found === documents.length &&
    missingPaths.length === 0 &&
    sourceReferences.length === 0 &&
    unexpectedReferenceProjects.length === 0
  );
}

function isCredentialError(error) {
  const message = `${error?.code ?? ''} ${error?.message ?? error}`;
  return /default credentials|credential|metadata server|unauthenticated|login/i.test(
    message,
  );
}

export async function main(argv = process.argv.slice(2)) {
  validateSafetyConstants();
  const { execute } = parseArguments(argv);
  const credential = applicationDefault();
  const sourceApp = initializeApp(
    { credential, projectId: SOURCE_PROJECT },
    SOURCE_APP_NAME,
  );
  const targetApp = initializeApp(
    { credential, projectId: TARGET_PROJECT },
    TARGET_APP_NAME,
  );

  try {
    const sourceDb = getFirestore(sourceApp);
    const targetDb = getFirestore(targetApp);
    const { topLevelCollections, inventory } = await buildInventory(
      sourceDb,
      targetDb,
    );
    printInventory(topLevelCollections, inventory, execute);

    if (inventory.readErrors.length > 0) {
      throw new Error(
        'Source inventory is incomplete; no target writes were made.',
      );
    }
    if (inventory.unsupportedTypes.size > 0) {
      throw new Error(
        'Unsupported value types were found; no target writes were made.',
      );
    }
    const unexpectedReferenceProjects = [...inventory.referenceProjects].filter(
      (project) => project !== SOURCE_PROJECT,
    );
    if (unexpectedReferenceProjects.length > 0) {
      throw new Error(
        `References from unexpected projects were found: ${unexpectedReferenceProjects.join(', ')}`,
      );
    }
    if (!execute) {
      console.log('Dry run complete. No target writes were attempted.');
      return;
    }

    console.log(
      `Writing only the ${inventory.documents.length} inventoried paths to ${TARGET_PROJECT}; no documents will be deleted.`,
    );
    const writeFailures = await writeDocuments(targetDb, inventory.documents);
    if (writeFailures.length > 0) {
      for (const failure of writeFailures)
        console.error(`WRITE ERROR: ${failure}`);
      throw new Error(`${writeFailures.length} target writes failed.`);
    }
    const verified = await verifyCopy(targetDb, inventory.documents);
    if (!verified) throw new Error('Post-copy verification failed.');
    console.log('Copy and verification completed successfully.');
  } catch (error) {
    if (isCredentialError(error)) {
      console.error('Application Default Credentials are unavailable. Run:');
      console.error('gcloud auth application-default login');
    }
    throw error;
  } finally {
    await Promise.all([deleteApp(sourceApp), deleteApp(targetApp)]);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  });
}
