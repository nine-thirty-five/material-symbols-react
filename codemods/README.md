# Codemods

Automated upgrades for `@nine-thirty-five/material-symbols-react`.

## `v1-to-v2`

Upgrades a codebase from **v1.x → v2.x**. It applies the two breaking changes
automatically so your icons keep looking and resolving the same:

1. **Default size: `24` → `1em`.** v2 icons default to `1em` (they scale with
   `font-size`). To preserve v1's fixed 24px look, the codemod adds `size={24}`
   to every icon element that doesn't already set `size`, `width`, or `height`.
   Pass `--size=skip` if you'd rather adopt the new `1em` default.

2. **14 renamed components.** A v1 bug dropped a bare `0` from some names. Their
   imports and JSX usages are renamed to the corrected v2 names, e.g.
   `SpeedFivex → SpeedZeroFivex`, `SignalWifiBar → SignalWifiZeroBar`,
   `Stat → StatZero`.

> Import paths are **not** changed — the v1 paths (`/outlined`,
> `/outlined/filled`, …) still work in v2 as aliases for weight 400.

### Run it

```sh
# TypeScript / TSX
npx jscodeshift -t node_modules/@nine-thirty-five/material-symbols-react/codemods/v1-to-v2.cjs \
  --parser tsx \
  src/

# Plain JS / JSX — use --parser babel
npx jscodeshift -t node_modules/@nine-thirty-five/material-symbols-react/codemods/v1-to-v2.cjs \
  --parser babel \
  src/
```

Options:

- `--size=skip` — keep the new `1em` default; don't add `size={24}`.
- `--dry --print` — preview changes without writing (standard jscodeshift flags).

### Limitations

- Icons used through a **namespace import** (`import * as Icons from …; <Icons.Search />`)
  are not transformed — rename/size those by hand.
- Elements that **spread props** (`<Search {...rest} />`) are skipped, since the
  spread may already supply a size.
- Always review the diff and run your formatter afterward.
