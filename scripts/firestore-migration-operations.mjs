export async function commitMigrationPlans(db, plans, batchSize = 450) {
  for (let offset = 0; offset < plans.length; offset += batchSize) {
    const batch = db.batch();
    for (const [operation, reference, data] of plans.slice(
      offset,
      offset + batchSize,
    )) {
      if (operation === 'update') batch.update(reference, data);
      else if (operation === 'merge')
        batch.set(reference, data, { merge: true });
      else if (operation === 'replace') batch.set(reference, data);
      else throw new Error(`Unknown migration operation: ${operation}`);
    }
    await batch.commit();
  }
}
