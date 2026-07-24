---
'@nine-thirty-five/material-symbols-react': minor
---

Accessibility defaults, require(esm) support, and an icon-search CLI:

- Icons are now decorative by default (`aria-hidden="true"`). A new `title` prop — or `aria-label`/`aria-labelledby` — makes an icon semantic: it gets `role="img"`, and `title` renders an SVG `<title>` as the accessible name.
- `exports` entries now use the `default` condition instead of `import`, so CommonJS consumers on Node ≥ 22 can `require()` the package via require(esm). The package remains ESM-only.
- New CLI: `npx @nine-thirty-five/material-symbols-react find <query>` searches the shipped `manifest.json` catalog and prints component names + import paths (`--json` for machine-readable output).
- The generator now fails the build when icon downloads error out after retries, so the automated release pipeline can never publish an incomplete package. The metadata snapshot also tracks each icon's `version`, so glyph redesigns trigger the weekly auto-update release.
