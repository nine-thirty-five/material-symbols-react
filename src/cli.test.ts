import { describe, it, expect } from 'vitest';
import { searchIcons, type ManifestIcon } from '../bin/search.js';

const icon = (
  name: string,
  component: string,
  tags: string[] = [],
  categories: string[] = []
): ManifestIcon => ({ name, component, tags, categories });

const ICONS: ManifestIcon[] = [
  icon('delete', 'Delete', ['trash', 'bin', 'remove', 'garbage'], ['action']),
  icon('delete_forever', 'DeleteForever', ['trash', 'permanent'], ['action']),
  icon('add', 'Add', ['plus', 'create', 'new'], ['content']),
  icon('arrow_back', 'ArrowBack', ['back', 'previous'], ['navigation']),
  icon('arrow_forward', 'ArrowForward', ['forward', 'next'], ['navigation']),
  icon('backspace', 'Backspace', ['delete', 'erase'], ['content']),
];

describe('searchIcons', () => {
  it('ranks an exact name match first', () => {
    const results = searchIcons(ICONS, ['delete']);
    expect(results[0].name).toBe('delete');
  });

  it('matches via tags', () => {
    const names = searchIcons(ICONS, ['trash']).map((i) => i.name);
    expect(names).toContain('delete');
    expect(names).toContain('delete_forever');
  });

  it('requires every term to match', () => {
    const names = searchIcons(ICONS, ['arrow', 'back']).map((i) => i.name);
    expect(names).toEqual(['arrow_back']);
  });

  it('matches component names case-insensitively', () => {
    const results = searchIcons(ICONS, ['DeleteForever']);
    expect(results[0].name).toBe('delete_forever');
  });

  it('respects the limit', () => {
    expect(searchIcons(ICONS, ['a'], 2)).toHaveLength(2);
  });

  it('returns nothing for an empty or unmatched query', () => {
    expect(searchIcons(ICONS, [])).toEqual([]);
    expect(searchIcons(ICONS, ['zzzz'])).toEqual([]);
  });
});
