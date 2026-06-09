import fs from 'fs';
import path from 'path';
import { optimize } from 'svgo';

export { toPascalCase, convertNumbersToWords, toComponentName } from './naming';

// ---------------------------------------------------------------------------
// Axis matrix
// ---------------------------------------------------------------------------

export type Style = 'outlined' | 'rounded' | 'sharp';
export type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700;
export type Fill = 0 | 1;

export const STYLES: Style[] = ['outlined', 'rounded', 'sharp'];
export const WEIGHTS: Weight[] = [100, 200, 300, 400, 500, 600, 700];
export const FILLS: Fill[] = [0, 1];

/** Default weight whose entrypoint is also aliased at the bare-style path. */
export const DEFAULT_WEIGHT: Weight = 400;

/** Material Symbols family name in the Google Fonts metadata, per style. */
const METADATA_FAMILY: Record<Style, string> = {
  outlined: 'Material Symbols Outlined',
  rounded: 'Material Symbols Rounded',
  sharp: 'Material Symbols Sharp',
};

const METADATA_URL =
  'https://fonts.google.com/metadata/icons?incomplete=true&key=material_symbols';

// ---------------------------------------------------------------------------
// SVG path extraction + optimization
// ---------------------------------------------------------------------------

const SVG_PATH_REGEX = /<path\b[^>]*\sd="([^"]*)"/gi;

/**
 * Extract the path `d` data from a Material Symbols SVG. Material Symbols are
 * single-path glyphs; if more than one path is ever present we concatenate the
 * `d` values (still valid SVG path data) and flag it for the caller to log.
 */
export function extractPath(svg: string): { d: string | null; multi: boolean } {
  const matches = [...svg.matchAll(SVG_PATH_REGEX)];
  if (matches.length === 0) return { d: null, multi: false };
  const d = matches.map((m) => m[1].trim()).join(' ');
  return { d, multi: matches.length > 1 };
}

/** Run SVGO over the path data to shrink it (numeric precision, redundant ops). */
export function optimizePath(d: string): string {
  try {
    const wrapped = `<svg viewBox="0 -960 960 960"><path d="${d}"/></svg>`;
    const res = optimize(wrapped, {
      multipass: true,
      plugins: [{ name: 'convertPathData', params: { floatPrecision: 3 } }],
    });
    const { d: out } = extractPath(res.data);
    return out ?? d;
  } catch {
    return d;
  }
}

// ---------------------------------------------------------------------------
// Metadata (official icon list)
// ---------------------------------------------------------------------------

export interface IconMeta {
  name: string;
  version: number;
  popularity: number;
  codepoint: number;
  categories: string[];
  tags: string[];
  /** Styles this icon is actually available in. */
  styles: Style[];
}

interface RawIcon {
  name: string;
  version: number;
  popularity: number;
  codepoint: number;
  unsupported_families: string[];
  categories: string[];
  tags: string[];
  sizes_px: number[];
}

/**
 * Fetch + parse the official Google Fonts Material Symbols metadata. The
 * response is prefixed with a `)]}'` anti-JSON-hijacking guard that we strip.
 * Returns only icons available in at least one Material Symbols style.
 */
export async function fetchIconMetadata(): Promise<IconMeta[]> {
  const res = await fetchTextWithRetry(METADATA_URL);
  if (res.status !== 'ok') {
    throw new Error(`Metadata fetch failed (${res.status}): ${METADATA_URL}`);
  }
  const text = res.text.replace(/^\)\]\}'/, '');
  const data = JSON.parse(text) as { icons: RawIcon[] };

  return data.icons
    .map((icon): IconMeta => {
      const styles = STYLES.filter(
        (style) => !icon.unsupported_families.includes(METADATA_FAMILY[style])
      );
      return {
        name: icon.name,
        version: icon.version,
        popularity: icon.popularity,
        codepoint: icon.codepoint,
        categories: icon.categories ?? [],
        tags: icon.tags ?? [],
        styles,
      };
    })
    .filter((icon) => icon.styles.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// SVG fetching (gstatic CDN) with on-disk cache + retry + concurrency limit
// ---------------------------------------------------------------------------

/** gstatic asset directory segment encoding the (weight, fill) variant. */
export function assetSegment(weight: Weight, fill: Fill): string {
  const w = weight === DEFAULT_WEIGHT ? '' : `wght${weight}`;
  const f = fill === 1 ? 'fill1' : '';
  return w + f || 'default';
}

export function svgUrl(
  style: Style,
  name: string,
  weight: Weight,
  fill: Fill
): string {
  return `https://fonts.gstatic.com/s/i/short-term/release/materialsymbols${style}/${name}/${assetSegment(
    weight,
    fill
  )}/24px.svg`;
}

const CACHE_DIR = path.resolve('.cache/svg');

/**
 * Outcome of a fetch. `missing` is a definitive 404 (the asset does not exist);
 * `error` is a transient failure after exhausting retries. The two are kept
 * distinct so we never cache — or silently tolerate — a transient failure.
 */
export type FetchResult =
  | { status: 'ok'; text: string }
  | { status: 'missing' }
  | { status: 'error' };

export type SvgResult =
  | { status: 'ok'; svg: string }
  | { status: 'missing' }
  | { status: 'error' };

async function fetchTextWithRetry(
  url: string,
  retries = 4
): Promise<FetchResult> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return { status: 'missing' };
      if (res.ok) return { status: 'ok', text: await res.text() };
      // 5xx / 429 / other — fall through and retry
    } catch {
      /* network error — fall through to retry */
    }
    // backoff: 100ms, 200ms, 400ms, 800ms
    await delay(100 * 2 ** attempt);
  }
  return { status: 'error' };
}

/**
 * Fetch a variant SVG, caching the result on disk for fast re-runs. A real 404
 * is cached as an empty file (so we don't refetch a known-absent variant); a
 * transient `error` is NOT cached, so a network blip can never be mistaken for a
 * missing icon on the next run.
 */
export async function getVariantSvg(
  style: Style,
  name: string,
  weight: Weight,
  fill: Fill
): Promise<SvgResult> {
  const cacheFile = path.join(
    CACHE_DIR,
    style,
    assetSegment(weight, fill),
    `${name}.svg`
  );
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf8');
    return cached === ''
      ? { status: 'missing' }
      : { status: 'ok', svg: cached };
  }

  const res = await fetchTextWithRetry(svgUrl(style, name, weight, fill));
  if (res.status === 'error') return { status: 'error' }; // do not cache transient failures

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, res.status === 'ok' ? res.text : '');
  return res.status === 'ok'
    ? { status: 'ok', svg: res.text }
    : { status: 'missing' };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Minimal concurrency limiter (no dependency). */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}
