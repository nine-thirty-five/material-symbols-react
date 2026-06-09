import fs from 'fs';
import path from 'path';
import {
  STYLES,
  WEIGHTS,
  FILLS,
  DEFAULT_WEIGHT,
  Style,
  Weight,
  IconMeta,
  fetchIconMetadata,
  getVariantSvg,
  extractPath,
  optimizePath,
  toComponentName,
  mapLimit,
} from './generate.utils';
import {
  EmittedIcon,
  writeBase,
  writeRootIndex,
  writeBarrel,
  writeAlias,
  writeManifest,
  buildExports,
  writePackageExports,
} from './emit';

interface Options {
  limit?: number;
  concurrency: number;
  svgo: boolean;
  metadataOnly: boolean;
  styles: Style[];
  weights: Weight[];
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const limit = get('--limit');
  const styles = get('--styles');
  const weights = get('--weights');
  return {
    limit: limit ? parseInt(limit, 10) : undefined,
    concurrency: parseInt(get('--concurrency') ?? '64', 10),
    svgo: !argv.includes('--no-svgo'),
    metadataOnly: argv.includes('--metadata-only'),
    styles: styles ? (styles.split(',') as Style[]) : STYLES,
    weights: weights ? (weights.split(',').map(Number) as Weight[]) : WEIGHTS,
  };
}

const DIST = path.resolve('dist');
const DATA = path.resolve('_data');

function weightDir(weight: Weight): string {
  return `${weight}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const t0 = Date.now();

  console.log('Fetching official Material Symbols metadata…');
  const allIcons = await fetchIconMetadata();
  console.log(`  ${allIcons.length} icons available across Material Symbols.`);

  // Persist the metadata snapshot (change detection + example search). Sorted
  // by name and free of volatile fields (e.g. popularity) so `git diff` flags
  // only real icon/category/tag changes — the signal the auto-update bot uses.
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(
    path.join(DATA, 'icons.json'),
    JSON.stringify(
      allIcons.map(({ name, categories, tags, styles }) => ({
        name,
        categories,
        tags,
        styles,
      }))
    ) + '\n'
  );

  if (opts.metadataOnly) {
    console.log(`Wrote _data/icons.json (${allIcons.length} icons).`);
    return;
  }

  let icons = allIcons;
  if (opts.limit) {
    icons = [...allIcons]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, opts.limit);
    console.log(`  --limit: generating top ${icons.length} by popularity.`);
  }

  // Fresh dist.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  writeBase(DIST);
  writeRootIndex(DIST);

  // Searchable catalog for tools/agents — built from the full icon set (always
  // complete, even under --limit) so it matches the published package.
  writeManifest(
    DIST,
    allIcons.map((i) => ({
      name: i.name,
      component: toComponentName(i.name),
      categories: i.categories,
      tags: i.tags,
    })),
    {
      pkg: '@nine-thirty-five/material-symbols-react',
      styles: STYLES,
      weights: WEIGHTS,
      defaultWeight: DEFAULT_WEIGHT,
    }
  );

  const missing: string[] = [];
  const errors: string[] = [];
  const multiPath: string[] = [];
  const collisions: string[] = [];
  let emitted = 0;

  for (const style of opts.styles) {
    const styleIcons = icons.filter((i) => i.styles.includes(style));

    for (const weight of opts.weights) {
      for (const fill of FILLS) {
        const variant = `${style}/${weightDir(weight)}${fill ? '/filled' : ''}`;
        process.stdout.write(`Generating ${variant} … `);

        const built = await mapLimit(
          styleIcons,
          opts.concurrency,
          async (meta: IconMeta): Promise<EmittedIcon | null> => {
            const res = await getVariantSvg(style, meta.name, weight, fill);
            if (res.status === 'error') {
              errors.push(`${variant}/${meta.name}`);
              return null;
            }
            if (res.status === 'missing') {
              missing.push(`${variant}/${meta.name}`);
              return null;
            }
            const { d, multi } = extractPath(res.svg);
            if (!d) {
              missing.push(`${variant}/${meta.name}`);
              return null;
            }
            if (multi) multiPath.push(`${variant}/${meta.name}`);
            return {
              component: toComponentName(meta.name),
              d: opts.svgo ? optimizePath(d) : d,
            };
          }
        );

        const list = (built.filter(Boolean) as EmittedIcon[]).sort((a, b) =>
          a.component.localeCompare(b.component)
        );

        // Safety net: two icon names must never map to the same component name
        // (it would emit a duplicate `export const`). Keep the first, log the rest.
        const seen = new Set<string>();
        const deduped = list.filter((icon) => {
          if (seen.has(icon.component)) {
            collisions.push(`${variant}/${icon.component}`);
            return false;
          }
          seen.add(icon.component);
          return true;
        });

        const segments = [style, weightDir(weight)];
        if (fill) segments.push('filled');
        writeBarrel(DIST, segments, deduped);
        emitted += deduped.length;
        console.log(`${deduped.length} icons`);
      }
    }

    // Back-compat aliases: bare style path -> default weight.
    writeAlias(DIST, [style], [style, weightDir(DEFAULT_WEIGHT)]);
    writeAlias(
      DIST,
      [style, 'filled'],
      [style, weightDir(DEFAULT_WEIGHT), 'filled']
    );
  }

  // Keep package.json `exports` in sync with the generated entrypoints, plus
  // the searchable manifest so tools can `import '<pkg>/manifest.json'`.
  const exportsMap: Record<string, unknown> = buildExports(
    opts.styles,
    opts.weights
  );
  exportsMap['./manifest.json'] = './dist/manifest.json';
  writePackageExports(path.resolve('package.json'), exportsMap);

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone in ${secs}s — emitted ${emitted} icon modules.`);
  if (multiPath.length)
    console.log(`Multi-path icons (concatenated): ${multiPath.length}`);
  if (missing.length)
    console.log(`Missing/unavailable variants: ${missing.length}`);
  if (collisions.length)
    console.log(
      `Dropped ${collisions.length} colliding component names: ${[
        ...new Set(collisions),
      ].join(', ')}`
    );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
