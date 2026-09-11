# Contributing to Throwl

Thanks for contributing. Keep changes focused and never commit credentials,
production Firebase files, or signing material.

## Prerequisites and setup

- Node.js `24.18.0` (the version in `.nvmrc`) and Corepack
- pnpm `10.24.0` (the `packageManager` version in `package.json`)
- Android Studio and a compatible JDK for Android development
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

The hardened rules introduce `publicProfiles`, exact-key `userLookups`, and
single-document `friendships`, and add immutable `owner` and `playerIds` fields
to games. Existing production data must be migrated before the owner deploys
the rules:

- for every `users/{uid}`, retain only `email` and `name`, create
  `publicProfiles/{uid}` with `name`, and create a lowercase-email
  `userLookups/{email}` containing `user: /users/{uid}`;
- convert each reciprocal legacy `friends` pair into one
  `friendships/{sortedUid_sortedUid}` document with `userIds`,
  `requester`, and `status` (`pending` or `accepted`);
- for each game, set `owner` to the account that owns the record and set
  `playerIds` to the UIDs represented by registered-user references in
  `players` (guest strings are excluded).

Back up and validate production data first. This repository deliberately does
not contain or execute an Admin SDK migration because owner selection for old
games needs product-owner review and production mutation is out of scope.

## Development and validation

```sh
pnpm nx run @throwl/throwl:run-android
pnpm nx run @throwl/throwl:pod-install
pnpm nx run @throwl/throwl:run-ios
pnpm lint:check
pnpm typecheck
pnpm test
pnpm test:firestore-rules
pnpm build
pnpm format:check
pnpm sync
```

Android debug builds use debug signing and do not need `keystore.properties`.
Actual release tasks fail clearly unless release signing is configured. iOS
store signing and all Fastlane deployment credentials are maintainer-only.

Branch from `master`, follow the existing gitmoji/commitlint style, and include
screenshots for visual changes. Releases currently trigger on every tag (`*`),
so the owner should protect that tag namespace and `master` with GitHub rulesets.

App Check is optional post-publication abuse hardening. Firestore Security Rules,
not App Check, remain the authorization boundary.
