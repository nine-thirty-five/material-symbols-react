# Contributing

Thanks for helping improve `@nine-thirty-five/material-symbols-react`!

## Overview

This package is **generated**. The icon components are not committed — they are produced by a
build script from Google's official Material Symbols artifacts and written straight to `dist/`.

- **Icon list** comes from the official metadata API
  (`https://fonts.google.com/metadata/icons?…key=material_symbols`), filtered to icons available in
  the Material Symbols families. A snapshot is committed at [`_data/icons.json`](./_data/icons.json)
  and powers both change-detection (the weekly auto-update) and the example's search.
- **SVGs** come from the `fonts.gstatic.com` CDN, one per variant
  (`…/materialsymbols{style}/{name}/{segment}/24px.svg`, where `segment` is `default`, `fill1`,
  `wght{W}`, or `wght{W}fill1`).

There is **no web scraping and no headless browser**.

## Project layout

```
src/
  naming.ts          # snake_case -> PascalCase component names (shared, pure)
  generate.utils.ts  # metadata fetch, SVG fetch+cache, path extraction + SVGO
  emit.ts            # writes dist: shared base, barrels, aliases, exports map
  generate.ts        # orchestrator (CLI)
  runtime/base.js    # the shared <svg> component, copied verbatim to dist/_base.js
  *.test.ts(x)       # vitest unit / render / tree-shaking tests
example/             # interactive showcase (Parcel)
```

## Local development

```sh
npm install

# Generate a small sample (top 80 icons) across the full style/weight/fill matrix:
npm run generate:sample

# Or refresh just the committed metadata snapshot (no SVG downloads):
npm run metadata

# Full generation (~3900 icons, downloads cached under .cache/):
npm run build
```

Downloaded SVGs are cached in `.cache/` so re-runs are fast.

### Checks

```sh
npm run lint
npm run typecheck
npm test
npx publint --strict   # after a generate, validates the exports/types contract
```

### Running the example

```sh
npm run generate:sample            # build a dist for the example to resolve
cd example && npm install && npm start
```

## How a component is built

Each Material Symbol is a single-path SVG. The generator extracts the `d` attribute, optimizes it
with SVGO, and emits a one-line module:

```js
export const Search = /*#__PURE__*/ b('M784-120 …');
```

over a shared `_base` component that renders the `<svg>` (with `viewBox="0 -960 960 960"`,
`fill="currentColor"`, and a `size` prop defaulting to `1em`). The `/*#__PURE__*/` annotation plus
`"sideEffects": false` is what makes unused icons tree-shake away.

## Commits & releases

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by
  commitlint).
- User-facing changes should include a [changeset](https://github.com/changesets/changesets):
  `npx changeset`.
- The weekly **Auto Update** workflow refreshes the metadata snapshot, and on any icon change bumps
  the version and publishes.

## Releasing v2

Publishing is **not** triggered by merging to `main` (that only runs CI). A single **Publish**
workflow does everything — build, `npm publish`, and create the GitHub Release:

```
push tag vX.Y.Z ─► Publish workflow ─► build ─► npm publish (OIDC) ─► gh release create
```

Prerequisite (one-time): **npm Trusted Publishing (OIDC)** configured for this repo + `publish.yml`
on npmjs.com. The workflow publishes with OIDC + `--provenance` and creates the Release with the
built-in `GITHUB_TOKEN` — so **no `NPM_TOKEN` and no `GH_TOKEN` secrets are needed**. (If you'd
rather use token auth, add `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` to the publish step instead.)

To cut the `2.0.0` release:

```sh
# package.json is already at 2.0.0 — tag the release commit on main and push the tag.
git checkout main && git pull
git tag v2.0.0
git push origin v2.0.0
```

Pushing the tag triggers Publish, which runs a **full generation** (downloads ~3900 icons from
gstatic, ~10 min), publishes the built `dist`, and opens a GitHub Release with generated notes.

The weekly **Auto Update** workflow uses the same Publish workflow: on an icon change it bumps the
version, pushes the tag, and dispatches Publish via `workflow_dispatch` (allowed for the built-in
token). You can also run **Publish** manually from the Actions tab to release the current
`package.json` version.
