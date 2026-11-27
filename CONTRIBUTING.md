# Contributing to Throwl

Thanks for contributing. Keep changes focused and never commit credentials,
production Firebase files, or signing material.

## Prerequisites and setup

- Node.js `24.18.0` (the version in `.nvmrc`) and Corepack
- pnpm `10.24.0` (the `packageManager` version in `package.json`)
- Android Studio, Android SDK Platform 37, and JDK 17 or newer (CI uses JDK 22)
- Xcode 27.2 (iOS SDK 27.2), Ruby, Bundler, and CocoaPods for iOS builds on macOS

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

## Scoring handoffs and compatible releases

The signed-in creator and registered participants can score. A creator outside
the lineup has no Played Games entry. Authenticated creators can also score
guest-only games, which have no history entries and cannot be reopened from
Played Games.

Use one active scorekeeper per game. Wait for the completed visit to save before
handing off. Team revisions reject stale writes and let a participant reopen the
saved game. Individual games retain their existing offline writes and document
format. Their writes are last-write-wins, including writes from older clients,
so concurrent scoring can overwrite another scorer’s changes.

Deploy the Firestore rules to staging before testing updated clients. Verify
handoff, guest-only saves and older-client behaviour on both platforms. For an
approved production release, deploy the compatible rules before distributing
the updated app. Keep those rules in place if the client is rolled back after
team documents have been created.

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

### Release build retries

Before merging the release workflow change, a maintainer must provision the
`RELEASE_ARTIFACT_KEY` GitHub Actions repository secret once. From an
authenticated checkout, generate it without printing it:

```sh
openssl rand -hex 32 | gh secret set RELEASE_ARTIFACT_KEY
```

The build job stores only the encrypted signed bundle, for seven days. If store
upload fails, fix the store issue and choose **Re-run failed jobs** on the same
workflow run. The successful build job's artifact ID selects the original
bundle. If the artifact expired or the key was rotated, rerun the build too.
Keep the key stable while any upload retries are pending.

Pushes to `master` that change the app, dependencies, or release tooling validate
and build both platforms. These runs use release signing and warm native caches
without retaining bundles or uploading to the stores. A newer qualifying push
cancels an older post-merge run. Tag releases run independently and can restore
eligible caches from `master`.

To check encrypted bundle creation on GitHub without uploading to the stores,
run the release workflow manually with `publish: false`. That run requires
release signing and the artifact secret, and retains the encrypted bundles.

### Prepare production store submissions

The release target opens `VISUAL` or `EDITOR` for your changelog and store notes
before bumping and tagging the app. It creates a GitHub draft with your text.
For noninteractive use, set `THROWL_RELEASE_NOTES_FILE` to the absolute path to
a Markdown file containing the notes block. Enter `whatsNew` for each store
locale (500 characters maximum) and optional `iosPromotionalText` (170
characters maximum).
Use an empty string to clear promotional text or omit it to preserve the store's
existing text. You can edit the notes on GitHub before approval. Leave the
status header intact.

The same tag workflow validates, builds, and uploads both candidate builds,
then waits at **Review deployments**. Test the exact TestFlight and Play
Internal builds before approving `store-review` in that run.

Before the first release, configure the `store-review` GitHub environment with
required reviewers, allow version tags, and allow self-review if you cut and
approve releases yourself. The job checks the run's approval history before
writing to either store. The App Store Connect key needs permission to manage versions and review
drafts, and the Play service account needs permission to edit production
releases. The workflow reuses the existing Actions credentials.

The workflow reports each store separately and marks the GitHub draft ready
only after both stores confirm the exact builds are prepared. Submit for
review manually in each store. The workflow leaves the GitHub release in
draft so a maintainer can publish it at the appropriate time. Apple manual
release after approval is set on the prepared version. Use Play managed
publishing if Play should also wait for a manual rollout after review.
