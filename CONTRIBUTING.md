# Contributing to Throwl

Thanks for contributing. Keep changes focused and never commit credentials,
production Firebase files, or signing material.

## Prerequisites and setup

- Node.js `24.18.0` (the version in `.nvmrc`) and Corepack
- pnpm `10.24.0` (the `packageManager` version in `package.json`)
- Android Studio, the Android SDK, and JDK 17 or newer (CI uses JDK 22)
- On macOS for iOS: current Xcode command-line tools, Ruby, Bundler, and CocoaPods

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm nx show projects
```

CI reads `.nvmrc`, so local and hosted Node versions remain aligned.

## Firebase contributor setup

1. Create your own Firebase project. Do not request production credentials.
2. Register Android and iOS apps using identifiers you control. If running the
   unmodified native projects locally, their configured identifiers must match.
3. Enable **Email/Password** under Firebase Authentication.
4. Create a Cloud Firestore database.
5. Download and place the platform configuration files at these ignored paths:
   - `apps/throwl/android/app/google-services.json`
   - `apps/throwl/ios/Throwl/GoogleService-Info.plist`
6. Deploy the repository rules to that contributor project, if desired:

   ```sh
   pnpm firebase use YOUR_NON_PRODUCTION_PROJECT_ID
   pnpm firebase deploy --only firestore:rules,firestore:indexes
   ```

Do not use a service-account key for the app or local rules tests. The test
command uses the demo project ID `demo-throwl-rules` and the local emulator, so
it cannot contact a production Firebase project:

```sh
pnpm test:firestore-rules
```

### Schema migration before deploying these rules

Production uses the direct-cutover procedure in
[`docs/FIRESTORE_CUTOVER.md`](docs/FIRESTORE_CUTOVER.md). The final app must be
approved and downloadable in both stores before the maintenance window starts;
do not improvise a rules-first rollout.

The hardened rules introduce `publicProfiles`, exact-key `userLookups`, and
single-document `friendships`, immutable `playerIds`, and mutable
`historyUserIds` fields to games. New games also record immutable `createdBy`;
legacy games deliberately do not. Existing production data must be migrated
before the operator deploys the rules:

- prepare `publicProfiles`, normalized-email `userLookups`, canonical
  friendships, and additive game authorization fields while retaining the v4
  schema;
- convert each reciprocal legacy `friends` pair into one
  `friendships/{sortedUid_sortedUid}` document with `userIds`,
  `requester`, and `status` (`pending` or `accepted`);
- reconcile canonical state from frozen authoritative v4 data and then remove
  legacy `users.friends`; do not remove `games.players` or infer `createdBy`.

Back up and validate production data first. The migration refuses duplicate
normalized email addresses and malformed game participants. It uses Application
Default Credentials and is a dry run unless `--apply` is present:

```sh
gcloud auth application-default login
pnpm migrate:firestore -- --project YOUR_PROJECT_ID --phase prepare --disposable-users UID1=review1@example.test,UID2=review2@example.test
pnpm migrate:firestore -- --project YOUR_PROJECT_ID --phase prepare --disposable-users UID1=review1@example.test,UID2=review2@example.test --apply
pnpm migrate:firestore -- --project YOUR_PROJECT_ID --phase verify --disposable-users UID1=review1@example.test,UID2=review2@example.test
```

`prepare` is safely rerunnable and preserves v4-required fields. `reconcile`
and `finalize` must run only during the verified all-client write freeze. Follow
the complete staged procedure in [the Firestore cutover runbook](docs/FIRESTORE_CUTOVER.md).
Do not use a downloaded service account key. The production owner must perform
this migration and rule deployment; these commands are never part of CI or the
local test suite.

## Development and validation

```sh
pnpm nx run @throwl/throwl:start
pnpm nx run @throwl/throwl:run-android
pnpm nx run @throwl/throwl:pod-install
pnpm nx run @throwl/throwl:run-ios
pnpm lint:check
pnpm typecheck
pnpm test
pnpm test:firestore-rules
pnpm build
pnpm format:check
```

Android debug builds use debug signing and do not need `keystore.properties`.
Actual release tasks fail clearly unless release signing is configured. iOS
store signing and all Fastlane deployment credentials are maintainer-only.

Branch from `master`, follow the existing gitmoji/commitlint style, and include
screenshots for visual changes. Releases currently trigger on every tag (`*`),
so the owner should protect that tag namespace and `master` with GitHub rulesets.

App Check is optional post-publication abuse hardening. Firestore Security Rules,
not App Check, remain the authorization boundary.
