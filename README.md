<h1 align="center">Material Symbols React</h1>

Use [Google's Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols) in React — **every style, weight and fill**, fully tree-shakeable, zero runtime dependencies.

<div align="center">

[![NPM version][npm-image]][npm-url]
[![Downloads][download-image]][npm-downloads]
![npm-typescript]
[![GitHub License](https://img.shields.io/badge/license-Apache--2.0-green)](./LICENSE)

</div>

- [Installation](#installation)
- [Usage](#usage)
  - [Importing](#importing)
  - [Weights](#weights)
  - [Props](#props)
- [Tree-shaking & bundle size](#tree-shaking--bundle-size)
- [Finding icons (for agents & tooling)](#finding-icons-for-agents--tooling)
- [ESM only](#esm-only)
- [Migrating from v1](#migrating-from-v1)
- [How it works](#how-it-works)
- [License](#license)

## Installation

```sh
npm install @nine-thirty-five/material-symbols-react
# or: yarn add … / pnpm add …
```

**Requires React 18 or 19** (peer dependency).

## Usage

Material Symbols come in three **styles** (`outlined`, `rounded`, `sharp`), seven **weights**
(`100`–`700`), and two **fills** (outlined / filled). Each combination is its own import path, so
your bundler only ships the exact icons you use.

### Importing

```tsx
// Default weight (400)
import { Search } from '@nine-thirty-five/material-symbols-react/outlined';
import { Home } from '@nine-thirty-five/material-symbols-react/outlined/filled';

// Specific weight
import { Star } from '@nine-thirty-five/material-symbols-react/rounded/300';
import { Favorite } from '@nine-thirty-five/material-symbols-react/rounded/700/filled';

// Sharp style
import { Delete } from '@nine-thirty-five/material-symbols-react/sharp/500';
```

```tsx
function Toolbar() {
  return (
    <>
      <Search />
      <Star size={32} />
      <Favorite color="crimson" />
    </>
  );
}
```

### Weights

Import paths follow the pattern `…/{style}[/{weight}][/filled]`:

| Path                   | Style    | Weight | Fill |
| ---------------------- | -------- | ------ | ---- |
| `…/outlined`           | outlined | 400    | 0    |
| `…/outlined/filled`    | outlined | 400    | 1    |
| `…/outlined/300`       | outlined | 300    | 0    |
| `…/rounded/700/filled` | rounded  | 700    | 1    |
| `…/sharp/100`          | sharp    | 100    | 0    |

Styles: `outlined`, `rounded`, `sharp`. Weights: `100`, `200`, `300`, `400`, `500`, `600`,
`700` (the bare path defaults to `400`). Append `/filled` for the filled variant.

### Props

Every icon accepts all SVG props (`SVGProps<SVGSVGElement>`), plus a convenience `size` prop:

```tsx
<Search size={32} />                 {/* sets width and height */}
<Search />                            {/* defaults to 1em — scales with font-size */}
<Search color="red" />                {/* icons use fill="currentColor" */}
<Search className="icon" />
<Search style={{ verticalAlign: 'middle' }} />
<Search onClick={…} aria-label="Search" />
```

- **`size`** — `number | string`. Sets both `width` and `height`. Defaults to `"1em"`, so icons
  scale with the surrounding `font-size`. Pass `width`/`height` explicitly to override.
- **Color** — icons render with `fill="currentColor"`, so they inherit `color` from CSS.

## Tree-shaking & bundle size

Each icon is a one-line module (`base("<path>")`) over a single shared component, marked
`/*#__PURE__*/` in a `"sideEffects": false` package. Importing one icon at one weight ships only
that path — not the rest of the set, and not other weights. Works with Vite, Next.js, webpack,
esbuild, Parcel, and Rollup.

## Finding icons (for agents & tooling)

Every install ships a searchable catalog at **`…/manifest.json`**
(`node_modules/@nine-thirty-five/material-symbols-react/dist/manifest.json`). Each
entry has the icon `name`, its exported `component`, `categories`, and rich `tags`
(synonyms) — so a tool or coding agent can resolve a natural-language request to a
component **offline**, no API calls:

```jsonc
{
  "importPattern": "import { <component> } from '@nine-thirty-five/material-symbols-react/<style>[/<weight>][/filled]'",
  "styles": ["outlined", "rounded", "sharp"],
  "weights": [100, 200, 300, 400, 500, 600, 700],
  "defaultWeight": 400,
  "icons": [
    {
      "name": "add",
      "component": "Add",
      "categories": ["…"],
      "tags": ["add", "create", "new", "plus", "+"],
    },
  ],
}
```

For example, to satisfy _"add a create icon to the button"_: match `create` against
`tags`, pick `Add`, and import it:

```tsx
import { Add } from '@nine-thirty-five/material-symbols-react/outlined';

<button>
  <Add /> Create
</button>;
```

The catalog is also importable directly:

```ts
import manifest from '@nine-thirty-five/material-symbols-react/manifest.json' with { type: 'json' };
```

## ESM only

This package ships **ES Modules only**. It works in all modern bundlers and ESM Node. If you need
to consume it from a CommonJS module under `node16`/`nodenext` resolution, use a dynamic
`import()`.

## Migrating from v1

v2 adds the weight axis and a few ergonomic changes:

- **Existing imports keep working.** `…/outlined` and `…/outlined/filled` still resolve to weight
  400, exactly as before.
- **Default size changed from `24` to `1em`.** Icons now scale with `font-size`. To restore the old
  fixed size, pass `size={24}` (or set `width`/`height`).
- **New `size` prop** and new weight entrypoints (`/100`–`/700`).
- **14 icon names corrected** (a v1 bug dropped a bare `0`), e.g. `SpeedFivex → SpeedZeroFivex`.
- **ESM-only** (v1 was effectively ESM too; the broken CJS `main` field has been removed).

### Automatic upgrade (codemod)

Run the bundled [codemod](./codemods/README.md) to apply the size and rename changes for you:

```sh
npx jscodeshift -t node_modules/@nine-thirty-five/material-symbols-react/codemods/v1-to-v2.cjs \
  --parser tsx src/
```

It adds `size={24}` to icons that relied on the old default and renames the 14 corrected
components. Pass `--size=skip` to adopt the new `1em` default instead.

## How it works

Icons are generated from Google's official artifacts — the icon list from the
[Material Symbols metadata API](https://fonts.google.com/metadata/icons) and the SVGs from the
`fonts.gstatic.com` CDN. The generator extracts each path, optimizes it with SVGO, and emits the
`dist` tree directly. No web scraping, no headless browser. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Material design icons are created by [Google](https://github.com/google/material-design-icons#license).

> We have made these icons available for you to incorporate into your products under the Apache
> License Version 2.0. Feel free to remix and re-share these icons and documentation in your
> products. We'd love attribution in your app's about screen, but it's not required.

[npm-url]: https://www.npmjs.com/package/@nine-thirty-five/material-symbols-react
[npm-image]: https://img.shields.io/npm/v/@nine-thirty-five/material-symbols-react
[download-image]: https://img.shields.io/npm/dm/@nine-thirty-five/material-symbols-react
[npm-downloads]: https://www.npmjs.com/package/@nine-thirty-five/material-symbols-react
[npm-typescript]: https://img.shields.io/npm/types/@nine-thirty-five/material-symbols-react
