# Throwl

Throwl is a free React Native darts-scoring app in an Nx monorepo. The workspace
uses pnpm and includes x01 and doubles games, accounts, friends, and private game
history backed by Firebase Authentication and Cloud Firestore.

## Quick start

Use Node.js from `.nvmrc` and pnpm `10.24.0` (declared in `package.json`). Then:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm nx run @throwl/throwl:start
pnpm nx run @throwl/throwl:run-android
pnpm nx run @throwl/throwl:pod-install
pnpm nx run @throwl/throwl:run-ios
```

Firebase platform files are intentionally absent. Follow [CONTRIBUTING.md](CONTRIBUTING.md)
to create a contributor-owned Firebase project and install its local config.

Useful checks:

```sh
pnpm lint:check
pnpm typecheck
pnpm test
pnpm test:firestore-rules
pnpm build
pnpm format:check
```

Run `pnpm sync` after generating a React Native library. Inspect available Nx
targets with `pnpm nx show project @throwl/throwl`.

## License and identity

Project-owned source code is licensed under [Apache-2.0](LICENSE). Third-party
components and Jost retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
The Throwl name, logo, app icon, and official store identity are reserved product
branding, as explained in [TRADEMARKS.md](TRADEMARKS.md). Forks are welcome and
should adopt their own public-facing identity.
