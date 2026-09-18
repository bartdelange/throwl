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
legacy games deliberately do not. Existing production data must be migrated before the operator deploys
the rules:

- for every `users/{uid}`, retain only `email` and `name`, create
  `publicProfiles/{uid}` with `name`, and create a lowercase-email
  `userLookups/{email}` containing `user: /users/{uid}`;
- convert each reciprocal legacy `friends` pair into one
  `friendships/{sortedUid_sortedUid}` document with `userIds`,
  `requester`, and `status` (`pending` or `accepted`);
- for each game, set `playerIds` and `historyUserIds` to the UIDs represented by
  registered-user references in `players` (guest strings are excluded); do not
  infer or backfill `createdBy`.

Back up and validate production data first. The migration refuses duplicate
normalized email addresses and malformed game participants. It uses Application Default Credentials, is a dry
run unless `--apply` is present, and is idempotent:

```sh
gcloud auth application-default login
pnpm migrate:firestore -- --project YOUR_PROJECT_ID --phase backfill
pnpm migrate:firestore -- --project YOUR_PROJECT_ID --phase backfill --apply
pnpm migrate:firestore -- --project YOUR_PROJECT_ID --phase finalize
pnpm migrate:firestore -- --project YOUR_PROJECT_ID --phase finalize --apply
```

`backfill` preserves the legacy `users.friends` arrays while creating exact new
documents and game authorization fields. `finalize` replaces constrained user,
profile, lookup, and friendship documents with canonical shapes and must only
run during the write-frozen hardened-rules cutover. Do not use a downloaded
service account key. The production owner must perform this migration and rule
deploy; these commands are never part of CI or the local test suite.

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
