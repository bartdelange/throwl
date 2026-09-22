# Firestore v5 staged cutover

Throwl uses an additive preparation phase before App Review and an
authoritative-v4 reconciliation after approval. Until the cutover write freeze,
the embedded v4 user/friendship representation is authoritative for real users.
Pre-cutover v5 use is restricted to explicitly configured, disposable Apple
Review and TestFlight accounts.

The migration is dry-run by default. No phase deploys rules, indexes, Remote
Config, or an app release.

## Safety model

- `prepare` is additive. It does not change `users`, remove `users.friends`, or
  remove `games.players`.
- `reconcile` is destructive and may only run after an all-client Firestore
  write freeze has been deployed and verified with both v4 and v5.
- `--disposable-users` is optional. When canonical-only review/test accounts
  exist, reconciliation requires explicit comma-separated `UID=expected-email`
  identity confirmations. An existing listed user must match both values and
  must have the canonical-only review/test account shape before any deletion is
  planned. An omitted list means there are zero disposable accounts.
- Mixed real/disposable games abort unless each reviewed game ID is explicitly
  passed with `--delete-games`.
- Canonical-only users not named as disposable abort reconciliation.
- Legacy games never receive a fabricated `createdBy`.
- Existing `historyUserIds` is intersected with current `playerIds`; it is not
  repopulated. This preserves v5 history removals.
- `finalize` first performs the full legacy-authoritative verification, then
  replaces real user documents with exact `{ email, name }` shapes.
- Firebase Auth deletion is not performed by this script. Disposable Auth users
  are a separate manual operational step.

## Commands

Set `PROJECT_ID` and keep the reviewed disposable UID list identical through
reconcile, verification, and finalize. Omit `--disposable-users` from all
commands when no canonical-only review/test accounts exist; legacy v4 accounts
must not be listed merely because they are test or personal accounts.

```sh
# Phase 1: dry-run, apply, verify
pnpm migrate:firestore -- --project PROJECT_ID --phase prepare --disposable-users UID1=review1@example.test,UID2=review2@example.test
pnpm migrate:firestore -- --project PROJECT_ID --phase prepare --disposable-users UID1=review1@example.test,UID2=review2@example.test --apply
pnpm migrate:firestore -- --project PROJECT_ID --phase verify --disposable-users UID1=review1@example.test,UID2=review2@example.test

# Phase 2, only after the verified all-client write freeze
pnpm migrate:firestore -- --project PROJECT_ID --phase reconcile --disposable-users UID1=review1@example.test,UID2=review2@example.test --delete-games REVIEWED_MIXED_GAME_ID
pnpm migrate:firestore -- --project PROJECT_ID --phase reconcile --disposable-users UID1=review1@example.test,UID2=review2@example.test --delete-games REVIEWED_MIXED_GAME_ID --apply
pnpm migrate:firestore -- --project PROJECT_ID --phase verify --disposable-users UID1=review1@example.test,UID2=review2@example.test

pnpm migrate:firestore -- --project PROJECT_ID --phase finalize --disposable-users UID1=review1@example.test,UID2=review2@example.test
pnpm migrate:firestore -- --project PROJECT_ID --phase finalize --disposable-users UID1=review1@example.test,UID2=review2@example.test --apply
pnpm migrate:firestore -- --project PROJECT_ID --phase verify --disposable-users UID1=review1@example.test,UID2=review2@example.test --finalized
```

`--delete-games` is optional and must contain only mixed real/disposable game
IDs that have been inspected and approved for deletion. Test-only games are
deleted automatically. A dry-run reports replace, merge, update, delete, and
total operation counts before any apply run, and names every user removed from
`historyUserIds`. A missing approved game ID is accepted on a retry because a
prior batch may already have deleted it; every still-existing approved game is
revalidated before deletion.

## Exact operational sequence

1. Audit/export the currently deployed rules and indexes.
2. Add and deploy the v5 `historyUserIds ARRAY_CONTAINS, started DESCENDING`
   history index while retaining every required v4 index.
3. Wait for the new index to report `READY`.
4. Deploy/use temporary v4+v5 compatibility rules. These must support v4 user
   queries, embedded friendship transactions and legacy games, plus the known
   v5 collections and writes. Do not deploy hardened v5-only rules yet.
5. Dry-run `prepare` with the explicit disposable UID list.
6. Run `prepare --apply`.
7. Run `verify` in legacy-authoritative mode.
8. Test the exact TestFlight/App Review build end-to-end using only configured
   disposable accounts.
9. Submit to and complete Apple review. Real users remain on v4.
10. After approval, enable v5 maintenance mode.
11. Deploy temporary Firestore all-client write-freeze rules. Remote Config
    maintenance mode alone does not stop v4.
12. Verify writes from both v4 and v5 are rejected. Admin migration credentials
    must remain available.
13. Back up PROD and record the exact rules/index state.
14. Dry-run `reconcile` with the same disposable UID list and any explicitly
    reviewed mixed game IDs.
15. Run `reconcile --apply`, then delete/reset the listed disposable Firebase
    Auth accounts using the audited manual procedure.
16. Run legacy-authoritative `verify`. Resolve every failure before proceeding.
17. Dry-run `finalize`.
18. Run `finalize --apply`.
19. Run `verify --finalized` again.
20. Deploy hardened v5 rules. Queued legacy writes must be rejected.
21. Smoke-test the approved v5 binary against PROD while maintenance remains
    enabled for normal users.
22. Release v5.
23. Confirm App Store availability.
24. Disable maintenance mode.

## Phase behavior

### Prepare

Prepare validates all legacy users, embedded friendships, and game player
references before applying anything. It then:

- refreshes `publicProfiles` from v4 user names;
- refreshes current normalized-email `userLookups`;
- refreshes canonical friendships from embedded v4 friendships;
- merges `playerIds` into games;
- initializes absent `historyUserIds` to `playerIds`;
- otherwise intersects `historyUserIds` with current `playerIds`;
- leaves all v4-required fields and all game domain state intact.

Prepare intentionally does not delete stale canonical records. It is safely
rerunnable while v4 remains live; changes after its read may be temporarily
stale and are authoritatively reconciled under the Phase 2 write freeze.

### Reconcile

Reconcile rebuilds complete canonical expectations from frozen v4 data. It:

- refreshes all real public profiles and current lookups;
- deletes stale lookups;
- refreshes expected friendships and deletes friendships absent from v4;
- backfills new v4 users and games;
- removes configured disposable Firestore users, profiles, lookups,
  friendships, and test-only games;
- aborts on unexplained canonical users/data and unsafe mixed games;
- recomputes game `playerIds` and safely preserves/intersects history state.

After reconcile, delete the configured disposable users from Firebase Auth
using an audited administrative procedure. The migration prints a reminder but
does not mutate Firebase Auth.

### Finalize and verify

Finalize refuses to plan writes unless the complete legacy-authoritative
reconciliation marker and verification pass. The marker is written as the last
reconcile operation, so the completed marker cannot exist before all earlier
reconcile batches commit. A multi-batch reconcile also writes a matching
`reconciling` marker in its first batch; only that marker permits recovery when
a disposable user document was deleted by an earlier successful batch. A
single-batch reconcile is atomic and does not need the intermediate marker.
Finalize removes legacy user fields by replacing each real user with
`{ email, name }`. It recognizes exact already-finalized user documents on a
retry, rejects all other user shapes, and writes its finalized marker last. It
never rewrites games.

Before finalization, verify proves exact friendship equality with embedded v4
state. After finalization that source no longer exists, so `--finalized`
validates canonical friendship shape, membership, profiles, lookups, and games
without attempting to reconstruct removed legacy arrays.

## Rollback

- Before `prepare --apply`: no data changed.
- After prepare: v4 remains authoritative and intact. Restore the prior
  compatibility rules if needed; additive records may remain unused.
- After reconcile but before finalize: keep the write freeze active. Restore the
  backup if reconciliation must be rolled back.
- After finalize: a v4 rollback requires restoring both the pre-cutover data
  backup and compatible rules. Do not recreate embedded friendship arrays by
  hand.
- Index deployment is additive and normally does not need rollback.

Never reopen client writes between reconcile, final verification, finalize, and
hardened-rule deployment.
