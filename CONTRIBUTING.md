# Contributing to Throwl

Thanks for your interest in **Throwl** 🎯  
This repository is public, but some configuration (Firebase, signing) is intentionally **not included**.

This document explains how to clone, run, and contribute safely.

---

## Prerequisites

### Required
- Node.js (use the version from `.nvmrc`)
- Yarn (this repo uses **Yarn 4**)
- Git

### Platform-specific

**Android**
- Android Studio
- JDK compatible with your Android setup

**iOS (macOS only)**
- Xcode
- Ruby + Bundler (only needed for CocoaPods / Fastlane)

---

## Setup

### 1. Clone the repository

git clone https://github.com/bartdelange/throwl.git  
cd throwl

### 2. Install dependencies

yarn install

> The `postinstall` script runs `patch-package` automatically.

---

## Running the app locally

### Android (debug)

yarn nx run @throwl/throwl:run-android

### iOS (debug, macOS only)

yarn nx run @throwl/throwl:pod-install  
yarn nx run @throwl/throwl:run-ios

Fastlane is **not required** for local debug builds.

---

## Firebase setup

This repository **does not include Firebase configuration files**.

To enable authentication and online features, you must supply your own Firebase project.

### Option A: Use your own Firebase project (recommended)

1. Create a Firebase project
2. Register an **Android app** and an **iOS app**
3. Download the configuration files:
  - Android: `google-services.json`
  - iOS: `GoogleService-Info.plist`

4. Place the files here:

apps/throwl/android/app/google-services.json  
apps/throwl/ios/Throwl/GoogleService-Info.plist

Example placeholder files exist:

apps/throwl/android/app/google-services.json.example  
apps/throwl/ios/Throwl/GoogleService-Info.plist.example

Do **not** commit real Firebase configuration files.

### Option B: Work without Firebase

If you are working on UI, layout, or offline logic, you may stub or bypass Firebase-related code  
(see `apps/throwl/src/services/firebase_service.ts`).

---

## Signing keys & store distribution

### Android
- Debug builds use the default debug keystore (no setup required)
- Release builds require a keystore and `keystore.properties`

The following files must **never** be committed:

```
**/*.keystore  
**/*.jks  
**/keystore.properties
```

### iOS
- App Store / TestFlight distribution is handled via Fastlane and Match
- Signing credentials are **not available** to contributors

---

## CI behavior (public repo)

- Pull requests (including from forks) run:
  - lint
  - tests
  - type checks

- Store distribution runs **only**:
  - on tag pushes
  - or via manual workflow dispatch

GitHub does **not** expose repository secrets to forked pull requests.

---

## Useful workspace commands

### Lint

yarn lint:check  
yarn lint:fix

### Format

yarn format

### Tests

yarn test

### Sync NX libraries (advanced / maintainers)

yarn sync

---

## What not to commit

Never commit any of the following:

```
**/google-services.json  
**/GoogleService-Info.plist  
**/*.keystore  
**/*.jks  
**/keystore.properties  
**/*.p12  
**/*.cer  
**/*.mobileprovision  
**/*.certSigningRequest  
**/xcuserdata/
```

If you accidentally commit something sensitive, remove it immediately and notify the maintainer.

---

## Branching & pull requests

- Branch from `master`
- Keep pull requests focused and small
- Clearly describe **what changed and why**
- Include screenshots or recordings for UI changes when relevant

---

## Fastlane (maintainers only)

CI reconstructs Firebase and signing files from GitHub Secrets and runs Fastlane lanes located in:

apps/throwl/fastlane

Contributors do **not** need to run Fastlane locally.

---

Thanks for contributing 🚀
