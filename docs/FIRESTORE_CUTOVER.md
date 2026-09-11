# Firestore direct cutover runbook

Throwl uses a direct cutover to the final `publicProfiles`, `userLookups`,
`friendships`, and game authorization schema. A dual-schema client is
intentionally not maintained: the installed population is small, legacy writes
cannot safely be reconciled after backfill, and the hardened rules reject the
dangerous legacy writes rather than silently accepting drift.

## Legacy 4.0.2 behavior after cutover

| Operation                               | Hardened result                                                                   | Legacy app effect                                                | Class |
| --------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----- |
| Sign in/startup and own profile read    | Allowed                                                                           | Account loads; finalized `friends` is absent and parses as empty | A     |
| Own-user snapshot                       | Allowed                                                                           | Continues receiving own name/email changes                       | A     |
| Friend list                             | Own user read succeeds, but legacy friend array is gone                           | Empty friend list                                                | B     |
| Email lookup                            | `users` query/list denied                                                         | Add-friend promise rejects; UI reports failure                   | B     |
| Request/accept/reject/remove friendship | Cross-user legacy transaction denied atomically                                   | Action fails; no partial friendship mutation                     | B     |
| Game-history query on `players`         | Query cannot prove `playerIds` membership and is denied                           | History does not load                                            | D     |
| Open a single-player game               | Game read and own profile read allowed                                            | Opens                                                            | A     |
| Open a registered multiplayer game      | Game read allowed, other user's private profile read denied                       | Detail/game parsing rejects                                      | D     |
| Create game                             | Missing `owner` and `playerIds`; denied                                           | Save fails                                                       | D     |
| Update an already migrated game         | Preserves immutable fields and is allowed for a member when payload remains valid | Turns may continue to save                                       | A     |
| Delete an already migrated game         | Allowed for a recorded member                                                     | Deletes                                                          | A     |
| Change name                             | Own canonical user update allowed                                                 | Works                                                            | A     |
| Change email                            | Allowed only after Auth email/token matches; lookup is not maintained by 4.0.2    | May update private email but leave lookup stale                  | C     |

The legacy auth listener supplies an error callback only when its caller does;
the 4.0.2 provider does not supply one. Own-user listening remains allowed, but
other permission failures are generally surfaced through rejected operation
promises or native Firebase logging rather than a dedicated incompatibility UI.

Native Firestore offline persistence is enabled by default. Offline batched
writes are visible locally and remain pending until reconnect. After the rules
cutover, rejected legacy writes are rolled back from the local cache and their
promises reject. Transactions require a server and do not queue while offline,
so reciprocal legacy friendship transactions cannot partially replay. The
hardened rules prevent queued legacy game creates and legacy `friends` fields
from reaching server state. A queued legitimate member update to an already
migrated game can succeed. To avoid the stale-lookup email case, the operational
cutover includes a short write freeze and requires users to update before normal
use resumes.

## Preconditions

- The final-schema Android and iOS binaries have passed production smoke tests,
  are approved, and are publicly downloadable in both stores.
- Store release notes and direct user communication state that 4.0.2 and older
  must update at the announced maintenance time.
- The owner has a Firestore export and the exact rules/index files that were
  deployed before maintenance.
- `owner-map.json` covers every game whose owner is not already unambiguous.
- Application Default Credentials belong to the intended production project;
  no downloaded service-account key is used.

## Cutover sequence

1. Prevent normal app use operationally and announce the write-freeze window.
   Do not rely on a Firestore gate that old binaries never implemented.
2. Confirm the final app is still downloadable in both stores. Do not continue
   while either platform is awaiting review or phased availability.
3. Export/backup Firestore and record the currently deployed rules and indexes.
4. Run the backfill dry-run. Resolve every reported owner, invalid reference,
   normalized-email collision, or malformed user; a non-zero exit blocks work.
5. Apply backfill, rerun its dry-run, and inspect counts plus representative
   profiles, lookups, friendships, and games.
6. Deploy `firestore.indexes.json`. Wait until every required index reports
   ready before changing rules.
7. Run the finalize dry-run, then finalize apply. This replaces `users`,
   `publicProfiles`, `userLookups`, and `friendships` with exact canonical
   shapes while preserving complete game domain documents.
8. Immediately deploy `firestore.rules`. Do not reopen writes between steps 7
   and 8.
9. Smoke-test with non-owner production accounts: sign-in, name change, exact
   friend lookup, request/accept/remove, game create/update/history/delete, and
   denial of unrelated access.
10. End the maintenance window. 4.0.2 and older are unsupported and must update.

Commands are dry-run unless `--apply` is supplied:

```sh
pnpm migrate:firestore -- --project PROJECT_ID --phase backfill --owner-map ./owner-map.json
pnpm migrate:firestore -- --project PROJECT_ID --phase backfill --owner-map ./owner-map.json --apply
pnpm migrate:firestore -- --project PROJECT_ID --phase finalize --owner-map ./owner-map.json
pnpm migrate:firestore -- --project PROJECT_ID --phase finalize --owner-map ./owner-map.json --apply
pnpm firebase deploy --project PROJECT_ID --only firestore:indexes
pnpm firebase deploy --project PROJECT_ID --only firestore:rules
```

## Rollback

- Before backfill apply: cancel maintenance; no data changed.
- After backfill but before finalize: rerunning is safe. Legacy arrays remain
  authoritative, so restore the pre-cutover rules and reopen the old app if
  necessary. New collections/fields may remain unused or be removed later.
- After finalize but before hardened rules: keep maintenance active. Prefer
  completing the immediate rules deployment. If that is impossible, restore
  the Firestore export and prior rules together; do not reconstruct legacy
  friendship arrays manually.
- After hardened rules: first restore the prior rules only if the final client
  is malfunctioning but data is sound. To return to 4.0.2 behavior, restore the
  matching pre-cutover Firestore export and prior rules as one coordinated
  rollback, then verify before ending maintenance.
- Index deployment is additive and need not be rolled back during an incident.

Never roll back data without also selecting rules/client behavior compatible
with that snapshot. Preserve failed migration logs and exports for diagnosis.
