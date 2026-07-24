# Changelog

## 2.2.0

### Minor Changes

- 42f17e3: Accessibility defaults, require(esm) support, and an icon-search CLI:

  - Icons are now decorative by default (`aria-hidden="true"`). A new `title` prop — or `aria-label`/`aria-labelledby` — makes an icon semantic: it gets `role="img"`, and `title` renders an SVG `<title>` as the accessible name.
  - `exports` entries now use the `default` condition instead of `import`, so CommonJS consumers on Node ≥ 22 can `require()` the package via require(esm). The package remains ESM-only.
  - New CLI: `npx @nine-thirty-five/material-symbols-react find <query>` searches the shipped `manifest.json` catalog and prints component names + import paths (`--json` for machine-readable output).
  - The generator now fails the build when icon downloads error out after retries, so the automated release pipeline can never publish an incomplete package. The metadata snapshot also tracks each icon's `version`, so glyph redesigns trigger the weekly auto-update release.

## 2.0.0

A major refactor focused on reliability, modern tooling, and a much larger icon surface.

### Added

- **Weight axis (100–700).** Every icon is now available in all seven weights via dedicated import
  paths, e.g. `…/outlined/300` and `…/rounded/700/filled`.
- **`size` prop** on every icon (sets width and height); default sizing is now `1em` so icons scale
  with `font-size`.
- Explicit, fully type-conditioned `exports` for the root and all entrypoints — resolves correctly
  under `node16`/`nodenext`/`bundler` and in Parcel, webpack, Vite, esbuild and Rollup.
- A test suite (Vitest): generator helpers, render behaviour, and a tree-shaking guard.
- CI workflow (lint, typecheck, test, `publint`).
- An interactive example app showcasing every style, weight, fill, size and color, with search and
  an "all 42 variants" view.
- A **`v1-to-v2` codemod** (`codemods/v1-to-v2.cjs`) that adds `size={24}` to preserve the old
  default size and renames the 14 corrected component names.

### Changed

- **Generation no longer uses Puppeteer or web scraping.** Icons are built from Google's official
  metadata API and the `fonts.gstatic.com` SVG CDN — deterministic and far faster.
- The build emits `dist` directly (no multi-GB heap, no Rollup pass over the whole matrix).
- Tooling modernized: ESLint 9 flat config, husky 9, single Node/tsx toolchain, refreshed
  dependencies.

### Removed

- Dependency on `puppeteer`, `ts-node`, and the broken CJS `main` field.
- The package is now **ESM-only**.

### Migrating

Existing `…/outlined` and `…/outlined/filled` imports continue to work (they map to weight 400).
The default icon size changed from a fixed `24` to `1em`; pass `size={24}` to restore it. See the
[README](./README.md#migrating-from-v1).
