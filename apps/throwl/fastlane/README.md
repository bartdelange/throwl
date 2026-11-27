## fastlane documentation

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios bump_version

```sh
[bundle exec] fastlane ios bump_version
```

Bump marketing version and build number

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build (and optionally upload) a TestFlight release bundle

### ios upload

```sh
[bundle exec] fastlane ios upload
```

Upload an existing signed IPA to TestFlight

### ios submit_tested_build

```sh
[bundle exec] fastlane ios submit_tested_build
```

Submit the approved TestFlight build for automatic release after App Review

---

## Android

### android bump_version

```sh
[bundle exec] fastlane android bump_version
```

Bump versionName and versionCode

### android beta

```sh
[bundle exec] fastlane android beta
```

Build (and optionally upload) a Beta/Release bundle

### android upload

```sh
[bundle exec] fastlane android upload
```

Upload an existing signed AAB to Play Internal

### android submit_tested_build

```sh
[bundle exec] fastlane android submit_tested_build
```

Promote the approved Play Internal build and send it for production review

---

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
