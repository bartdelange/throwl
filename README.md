<p align="center">
  <img src="docs/assets/throwl-icon.jpg" alt="Throwl app icon" width="128">
</p>

<h1 align="center">Throwl</h1>

<p align="center">
  A free darts scoring app for keeping track of games with friends and seeing how everyone played.
</p>

<p align="center">
  <a href="https://github.com/bartdelange/throwl/releases/latest"><img src="https://img.shields.io/github/v/release/bartdelange/throwl?display_name=tag&sort=semver" alt="Latest GitHub release"></a>
  <a href="https://github.com/bartdelange/throwl/actions/workflows/code-quality.yml"><img src="https://img.shields.io/github/actions/workflow/status/bartdelange/throwl/code-quality.yml?label=Code%20Quality" alt="Code Quality workflow status"></a>
  <a href="https://github.com/bartdelange/throwl/actions/workflows/release-throwl.yaml"><img src="https://img.shields.io/github/actions/workflow/status/bartdelange/throwl/release-throwl.yaml?label=Release" alt="Release workflow status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Apache-2.0 license"></a>
</p>

<p align="center">
  <a href="https://apps.apple.com/app/throwl/id1588360439"><img src="https://img.shields.io/badge/Download%20on%20the%20App%20Store-blue?logo=apple&logoColor=white" alt="Download Throwl on the App Store"></a>
  <a href="https://play.google.com/store/apps/details?id=com.throwl"><img src="https://img.shields.io/badge/Get%20it%20on%20Google%20Play-green?logo=google-play&logoColor=white" alt="Get Throwl on Google Play"></a>
</p>

## What is Throwl?

Throwl keeps score while you play darts, whether the players are friends with
Throwl accounts or guests sharing the same device. Play a standard x01 game or
practice every double in sequence, then review the result and detailed stats
when the game is over.

Your account keeps a private history of your games. Finished matches can be
revisited for their results, while an unfinished game can be picked up where it
left off.

## Screenshots

<p align="center">
  <img src="docs/assets/screenshots/home.png" alt="Throwl home screen with new game and played games actions" width="23%">
  <img src="docs/assets/screenshots/winner.png" alt="Throwl winner screen after a completed darts game" width="23%">
  <img src="docs/assets/screenshots/game.png" alt="Throwl darts board and multiplayer score table during a game" width="23%">
  <img src="docs/assets/screenshots/statistics.png" alt="Throwl post-game result and player statistics" width="23%">
</p>

## Features

- Play x01 from 301, 501, or a custom starting score, with a double checkout.
- Practice doubles from D20 down to D1, with options for a shorter match,
  skipping bulls, and ending a turn after an invalid throw.
- Score games for up to eight account holders or local guest players and
  randomize the playing order.
- Add friends by email and invite them into games.
- Record throws on an interactive dartboard and keep a live scoreboard.
- Reopen finished games for results, progress charts, and throw and turn stats.
- Resume unfinished games from the saved game history.

## Open source and contributing

Throwl is open source. Bug reports, contributions, and forks are welcome. For
the complete development guidelines and contributor-owned Firebase setup, see
[CONTRIBUTING.md](CONTRIBUTING.md).

### Requirements

- Node.js `24.18.0` (the version in `.nvmrc`)
- Corepack and pnpm `10.24.0` (declared in `package.json`)
- Android Studio, the Android SDK, and JDK 17 or newer for Android
- Current Xcode command-line tools, Ruby, Bundler, and CocoaPods for iOS

### Install and run

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm nx run @throwl/throwl:start
pnpm nx run @throwl/throwl:run-android
pnpm nx run @throwl/throwl:pod-install
pnpm nx run @throwl/throwl:run-ios
```

The app is built with React Native in an Nx workspace. Inspect all available
targets with `pnpm nx show project @throwl/throwl`.

Firebase platform files are intentionally absent. Create a contributor-owned
Firebase project and follow the [Firebase setup instructions](CONTRIBUTING.md#firebase-contributor-setup)
to add its local configuration. Never commit credentials, production Firebase
files, or signing material.

### Checks

```sh
pnpm lint:check
pnpm typecheck
pnpm test
pnpm test:firestore-rules
pnpm build
pnpm format:check
```

## License and branding

Project-owned source code is licensed under [Apache-2.0](LICENSE). Third-party
components and Jost retain their own licenses; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The Throwl name, logo, app icon, and official store identity are reserved
product branding, as explained in [TRADEMARKS.md](TRADEMARKS.md). Forks are
welcome and should use their own public-facing name, icon, identifiers, and
store listing.
