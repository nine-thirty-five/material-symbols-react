// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from 'esbuild';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Guards the core size promise: a consumer importing one icon from a barrel
 * must not pull in the others. Reproduces the emitted pattern (a shared base +
 * PURE-annotated named exports in a `sideEffects: false` package) and asserts
 * an unused export is dropped by the bundler.
 */
let dir: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'msr-treeshake-'));
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ type: 'module', sideEffects: false })
  );
  fs.writeFileSync(
    path.join(dir, '_base.js'),
    `export default (d) => () => d;\n`
  );
  fs.writeFileSync(
    path.join(dir, 'index.js'),
    `import b from './_base.js';\n` +
      `export const Alpha = /*#__PURE__*/ b("PATH_ALPHA_UNIQUE");\n` +
      `export const Beta = /*#__PURE__*/ b("PATH_BETA_UNIQUE");\n`
  );
  fs.writeFileSync(
    path.join(dir, 'entry.js'),
    `import { Alpha } from './index.js';\nconsole.log(Alpha);\n`
  );
});

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('tree-shaking', () => {
  it('drops unused PURE-annotated icon exports from a barrel', async () => {
    const res = await build({
      entryPoints: [path.join(dir, 'entry.js')],
      bundle: true,
      format: 'esm',
      write: false,
      treeShaking: true,
      minify: false,
    });
    const out = res.outputFiles[0].text;
    expect(out).toContain('PATH_ALPHA_UNIQUE');
    expect(out).not.toContain('PATH_BETA_UNIQUE');
  });
});
