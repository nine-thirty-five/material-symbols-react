// @vitest-environment node
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { writeManifest } from './emit';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'msr-manifest-'));
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('writeManifest', () => {
  it('writes a self-describing, searchable catalog', () => {
    writeManifest(
      dir,
      [
        {
          name: 'add',
          component: 'Add',
          categories: ['Common'],
          tags: ['add', 'create', 'new', 'plus'],
        },
        {
          name: 'search',
          component: 'Search',
          categories: ['Common'],
          tags: ['find', 'magnify'],
        },
      ],
      {
        pkg: '@scope/pkg',
        styles: ['outlined', 'rounded', 'sharp'],
        weights: [100, 400, 700],
        defaultWeight: 400,
      }
    );

    const m = JSON.parse(
      fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')
    );
    expect(m.package).toBe('@scope/pkg');
    expect(m.defaultWeight).toBe(400);
    expect(m.count).toBe(2);
    expect(m.importPattern).toContain('<component>');

    // An agent resolving "create" against tags should land on Add.
    const hit = m.icons.find((i: { tags: string[] }) =>
      i.tags.includes('create')
    );
    expect(hit.component).toBe('Add');
  });
});
