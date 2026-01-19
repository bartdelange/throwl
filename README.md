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

## Generating code (important)

We use Nx generators to create apps and libraries, **but generation is never the
final step**.

After every generator run, you must run:

`yarn run sync`

### Why?

Generators intentionally produce generic output.
`yarn run sync` brings generated code in line with Throwl’s conventions, such as:

- workspace-wide TypeScript config alignment
- path aliases / exports normalization
- lint / formatting consistency
- project structure guarantees

Skipping this step will leave the workspace in a partially-configured state.

### Examples

Generate a new app:

`nx g @nx/react-native:app demo`
`yarn run sync`

Generate a new library:

`nx g @nx/react:lib mylib`
`yarn run sync`

If you forget this step, assume something *will* break later.

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

If you add or modify projects, ensure they have the correct targets defined
and that yarn run sync has been applied before pushing.

---

## Editor support

Nx Console is recommended (VS Code or IntelliJ).
It provides generator UIs, task runners, and better autocompletion.

---

## Notes for contributors

- Do not manually copy existing libs or apps
- Always use generators
- Always run yarn run sync after generation
- If something feels “slightly off”, assume sync was skipped

This repo favors **repeatability over convenience**.
