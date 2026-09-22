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
      else if (operation === 'delete') batch.delete(reference);
      else throw new Error(`Unknown migration operation: ${operation}`);
    }
    await batch.commit();
  }
}

export function summarizeMigrationPlans(plans) {
  const summary = { replace: 0, merge: 0, update: 0, delete: 0, total: 0 };
  for (const [operation] of plans) {
    if (!(operation in summary) || operation === 'total') {
      throw new Error(`Unknown migration operation: ${operation}`);
    }
    summary[operation] += 1;
    summary.total += 1;
  }
  return summary;
}
