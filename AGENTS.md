# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository. Follow
these conventions and respect the gotchas — several are non-obvious and easy to
break.

## What this project is

`@nine-thirty-five/material-symbols-react` — a tree-shakeable React component
library for Google's Material Symbols, covering every **style** (outlined,
rounded, sharp) × **weight** (100–700) × **fill** (0/1).

The icon components are **generated, not committed.** A build script fetches
SVGs from Google's official artifacts and writes the publishable `dist/` tree
directly (no bundler step). Source lives in `src/`.

## Environment & commands

- **Node ≥ 22** (`.nvmrc` pins 24). Package manager: **npm**. There is **no Bun** —
  the generator runs through `tsx`.
- `npm install` — install dependencies.
- `npm run generate:sample` — generate a small subset (top ~80 icons) across the
  full style/weight/fill matrix. Fast, minimal download. **Use this for local dev.**
- `npm run build` — full generation (~3900 icons; downloads from the gstatic CDN,
  cached under `.cache/`). Emits `dist/` and refreshes `_data/icons.json`. Slow on
  a cold cache (~10–15 min), fast when cached.
- `npm run metadata` — refresh only the `_data/icons.json` snapshot (no SVG downloads).
- `npm test` — Vitest.
- `npm run lint` — ESLint (flat config, `eslint.config.js`).
- `npm run typecheck` — `tsc --noEmit`.
- `npm run format` — Prettier.
- `npm run codemod:v1-to-v2` — the consumer upgrade codemod (jscodeshift).

**Before committing, run:** `npm run lint && npm run typecheck && npm test`.

## Project layout

```
src/
  naming.ts          # snake_case -> PascalCase component names (pure, shared)
  generate.utils.ts  # metadata fetch, SVG fetch+cache (retry/discriminated result), SVGO
  emit.ts            # writes dist: shared base, barrels, aliases, exports map
  generate.ts        # orchestrator / CLI (flags: --limit, --concurrency, --metadata-only)
  runtime/base.js    # the shared <svg> component, copied verbatim to dist/_base.js
  *.test.ts(x)       # Vitest: unit / render / tree-shaking / codemod
codemods/v1-to-v2.cjs  # v1 -> v2 upgrade for consumers
example/             # interactive showcase (Parcel)
_data/icons.json     # committed metadata snapshot (change-detection + example search)
```

## Conventions

- **Commits: Conventional Commits**, enforced by commitlint via the husky
  `commit-msg` hook. Format: `type(scope): subject`. A bare message like `v2`
  is **rejected**. Allowed types: `build, chore, ci, docs, feat, fix, perf,
refactor, revert, style, test, translation, security, changeset`. Breaking
  changes use `!` (e.g. `feat!: …`). Example: `fix: keep bare zero in icon names`.
- The pre-commit hook runs lint-staged (`tsc --noEmit`, `eslint --fix`, `prettier`).
- User-facing changes should include a changeset: `npx changeset`.
- The package is **ESM-only**. Supported React: 18 and 19 (peer `react >=18`).

## Critical rules & gotchas

1. **Never hand-edit `dist/`** — it's generated. Edit `src/` and regenerate.
2. **Generated artifacts are gitignored** (`dist/`, `.cache/`, `icons/`). But
   **`_data/icons.json` IS committed** — it drives change-detection and the example.
3. **`weightDir()` in `src/generate.ts` and `buildExports()` in `src/emit.ts`
   must produce the same weight path segment** (currently the bare number, e.g.
   `400`, not `w400`). If they drift, `package.json` `exports` point at
   non-existent `dist` folders → a broken package. Note `writePackageExports`
   rewrites `package.json`'s `exports` on **every** build.
4. **Component names are public API** and are derived in `src/naming.ts`. Keep
   them stable. A bare `0` must convert to `Zero` — otherwise `speed_0_2x` and
   `speed_2x` both become `SpeedTwox`, producing a duplicate `export const` and a
   runtime `SyntaxError`. The generator also dedups as a safety net.
5. **Tree-shaking** depends on the `/*#__PURE__*/` annotations in the emitted
   barrels plus `"sideEffects": false` in `package.json`. Don't remove them or
   introduce side effects into barrels.
6. **`src/runtime/base.js`** is the single source of truth for the rendered
   `<svg>`; it's copied verbatim to `dist/_base.js`. It uses `forwardRef` +
   `createElement` (no JSX) so `dist` needs no compile step. Keep it
   dependency-free and JSX-free.
7. **Data source** is Google's official metadata API + the `fonts.gstatic.com`
   CDN. No Puppeteer, no web scraping, no third-party npm icon packages.

## Testing notes

- Vitest, tests next to source (`src/**/*.test.ts(x)`), default env is jsdom.
- Tests that use Node-only tooling (esbuild, jscodeshift) need
  `// @vitest-environment node` at the top — see `treeshake.test.ts`, `codemod.test.ts`.
- Don't add network calls to unit tests.

## CI & releasing

- `.github/workflows/ci.yml` runs lint + typecheck + test + a sample generate +
  `publint` on every PR.
- Publishing is intentional (tag push or manual dispatch), not triggered by
  merging. See **CONTRIBUTING.md → Releasing v2** for the OIDC/trusted-publishing
  setup and the exact steps.

## See also

- `README.md` — consumer usage and the weight/import-path matrix.
- `CONTRIBUTING.md` — how generation works and how to release.
- `codemods/README.md` — the v1 → v2 upgrade.
