import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RUNTIME_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'runtime'
);

export interface EmittedIcon {
  /** Exported PascalCase component name. */
  component: string;
  /** Optimized SVG path `d` data. */
  d: string;
}

/** Relative specifier from a folder `depth` levels deep back to the dist root. */
function relToRoot(depth: number): string {
  return Array(depth).fill('..').join('/');
}

function write(file: string, contents: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

/**
 * Shared base component, copied verbatim from `src/runtime/base.{js,d.ts}`
 * (the single source of truth) to `dist/_base.{js,d.ts}`. Plain ESM
 * (React.createElement, no JSX) so the emitted dist needs no compile step.
 */
export function writeBase(distDir: string) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(
    path.join(RUNTIME_DIR, 'base.js'),
    path.join(distDir, '_base.js')
  );
  fs.copyFileSync(
    path.join(RUNTIME_DIR, 'base.d.ts'),
    path.join(distDir, '_base.d.ts')
  );
}

/** Root entrypoint: re-exports the shared types only (keeps tree-shaking intact). */
export function writeRootIndex(distDir: string) {
  write(path.join(distDir, 'index.js'), `export {};\n`);
  write(
    path.join(distDir, 'index.d.ts'),
    `export type { Icon, IconProps } from './_base.js';\n`
  );
}

export interface ManifestIcon {
  /** Material Symbols name (snake_case). */
  name: string;
  /** Exported component identifier (PascalCase) — what you import. */
  component: string;
  categories: string[];
  /** Synonyms — match a natural-language request against these. */
  tags: string[];
}

/**
 * A self-describing, searchable icon catalog written to `dist/manifest.json`.
 * It ships in the published package so tools and coding agents can map a
 * request (e.g. "a create icon") to a component + import path **offline**,
 * by matching against `tags`/`name`/`categories`.
 */
export function writeManifest(
  distDir: string,
  icons: ManifestIcon[],
  meta: {
    pkg: string;
    styles: readonly string[];
    weights: readonly number[];
    defaultWeight: number;
  }
) {
  const manifest = {
    package: meta.pkg,
    description:
      'Searchable Material Symbols catalog. To fulfil an icon request, match it ' +
      'against each entry’s tags/name/categories, then import the `component`.',
    importPattern: `import { <component> } from '${meta.pkg}/<style>[/<weight>][/filled]'`,
    example: `import { Add } from '${meta.pkg}/outlined'`,
    styles: meta.styles,
    weights: meta.weights,
    defaultWeight: meta.defaultWeight,
    count: icons.length,
    icons,
  };
  write(path.join(distDir, 'manifest.json'), JSON.stringify(manifest));
}

/**
 * A single entrypoint barrel (one weight+fill of one style). Icons are emitted
 * as PURE-annotated named exports so bundlers tree-shake unused ones while the
 * whole entrypoint stays a handful of files instead of thousands.
 */
export function writeBarrel(
  distDir: string,
  segments: string[],
  icons: EmittedIcon[]
) {
  const dir = path.join(distDir, ...segments);
  const rel = relToRoot(segments.length);

  const js =
    `import b from '${rel}/_base.js';\n` +
    icons
      .map((i) => `export const ${i.component} = /*#__PURE__*/ b("${i.d}");`)
      .join('\n') +
    '\n';

  const dts =
    `import type { Icon } from '${rel}/_base.js';\n` +
    icons.map((i) => `export declare const ${i.component}: Icon;`).join('\n') +
    '\n';

  write(path.join(dir, 'index.js'), js);
  write(path.join(dir, 'index.d.ts'), dts);
}

/**
 * Build an explicit `exports` map for every generated entrypoint. Explicit
 * entries (vs a `./*` wildcard) resolve in every bundler — including Parcel and
 * older webpack/TypeScript resolution modes that don't implement subpath
 * patterns.
 */
export function buildExports(
  styles: readonly string[],
  weights: readonly number[]
): Record<string, { types: string; import: string }> {
  const map: Record<string, { types: string; import: string }> = {
    '.': { types: './dist/index.d.ts', import: './dist/index.js' },
  };
  const add = (subpath: string, dir: string) => {
    map[subpath] = {
      types: `./dist/${dir}/index.d.ts`,
      import: `./dist/${dir}/index.js`,
    };
  };
  for (const style of styles) {
    add(`./${style}`, style); // alias -> default weight
    add(`./${style}/filled`, `${style}/filled`);
    for (const weight of weights) {
      // Weight is a bare number in the path (no `w` prefix), matching the
      // dist folder layout produced by the generator's weightDir().
      add(`./${style}/${weight}`, `${style}/${weight}`);
      add(`./${style}/${weight}/filled`, `${style}/${weight}/filled`);
    }
  }
  return map;
}

/** Write the generated `exports` map back into package.json, preserving the rest. */
export function writePackageExports(
  packageJsonPath: string,
  exportsMap: Record<string, unknown>
) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  pkg.exports = exportsMap;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

/** Back-compat alias entrypoint (`./outlined` -> `./outlined/400`). */
export function writeAlias(distDir: string, from: string[], to: string[]) {
  const dir = path.join(distDir, ...from);
  // relative path from the alias folder to the target folder
  let target = path.posix.relative(from.join('/'), to.join('/'));
  if (!target.startsWith('.')) target = `./${target}`;
  const spec = `${target}/index.js`;
  write(path.join(dir, 'index.js'), `export * from '${spec}';\n`);
  write(path.join(dir, 'index.d.ts'), `export * from '${spec}';\n`);
}
