# Throwl

This repository contains the **Throwl** monorepo, managed with Nx and Yarn.

The workspace is intentionally opinionated. Code generation is followed by a
mandatory normalization step to keep configuration, exports, and conventions
consistent across the repo.

---

## Running the app

Run the iOS app:

`nx run @throwl/throwl:run-ios`

Run the Android app:

`nx run @throwl/throwl:run-android`

To see all available targets for a project:

`nx show project @throwl/throwl`

Targets are either inferred automatically or defined in `project.json` /
`package.json`.

---

## Generating code

Use Nx generators to create apps and libraries. Workspace generator defaults
configure lint, Jest, project files, and inferred TypeScript typechecking.

React Native's library generator does not currently create pnpm package exports.
Run `pnpm run sync` after generating a React Native library to add the private
workspace-package metadata and public `src/index.ts` export.

### Examples

Generate a new app:

`pnpm nx g @nx/react-native:app demo`

Generate a new library:

`pnpm nx g @nx/react:lib libs/mylib --importPath=@throwl/mylib`

Generate a React Native library:

`pnpm nx g @nx/react-native:lib libs/mylib --importPath=@throwl/mylib`
`pnpm run sync`

---

## Workspace structure

- apps/ – runnable applications
- libs/ – shared and feature libraries
- tools/ – workspace tooling and scripts
- nx.json, tsconfig.base.json – global configuration

The workspace is designed to scale without sacrificing type safety or clarity.

---

## CI

CI is expected to run tasks through Nx to take advantage of caching and
dependency-aware execution.

If you add or modify projects, verify their inferred targets with
`pnpm nx show project <project>` before pushing.

---

## Editor support

Nx Console is recommended (VS Code or IntelliJ).
It provides generator UIs, task runners, and better autocompletion.

---

## Notes for contributors

- Do not manually copy existing libs or apps
- Always use generators
- Run `pnpm run sync` after generating a React Native library

This repo favors **repeatability over convenience**.
