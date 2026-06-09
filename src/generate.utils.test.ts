import { describe, it, expect } from 'vitest';
import {
  toPascalCase,
  convertNumbersToWords,
  toComponentName,
  extractPath,
  optimizePath,
  assetSegment,
  svgUrl,
} from './generate.utils';

describe('toPascalCase', () => {
  it('PascalCases snake_case', () => {
    expect(toPascalCase('add_circle')).toBe('AddCircle');
    expect(toPascalCase('search')).toBe('Search');
  });
});

describe('convertNumbersToWords', () => {
  it('replaces digit runs with words', () => {
    expect(convertNumbersToWords('3d_rotation')).toBe('Threed_rotation');
    expect(convertNumbersToWords('123')).toBe('OneHundredTwentyThree');
    expect(convertNumbersToWords('10k')).toBe('Tenk');
  });

  it('keeps a bare zero (does not drop it)', () => {
    expect(convertNumbersToWords('speed_0_2x')).toBe('speed_Zero_Twox');
  });
});

describe('toComponentName', () => {
  it('produces valid PascalCase identifiers', () => {
    expect(toComponentName('search')).toBe('Search');
    expect(toComponentName('add_circle')).toBe('AddCircle');
    expect(toComponentName('3d_rotation')).toBe('ThreedRotation');
    expect(toComponentName('10k')).toBe('Tenk');
  });

  it('never starts with a digit', () => {
    for (const name of ['10k', '123', '3d_rotation', '60fps', '4k']) {
      expect(toComponentName(name)).toMatch(/^[A-Za-z]/);
    }
  });

  it('disambiguates names that differ only by a zero', () => {
    expect(toComponentName('speed_2x')).toBe('SpeedTwox');
    expect(toComponentName('speed_0_2x')).toBe('SpeedZeroTwox');
    expect(toComponentName('speed_0_2x')).not.toBe(toComponentName('speed_2x'));
  });
});

describe('extractPath', () => {
  it('extracts the d of a single-path svg', () => {
    const svg =
      '<svg viewBox="0 -960 960 960"><path d="M10 10h4v4h-4z"/></svg>';
    expect(extractPath(svg)).toEqual({ d: 'M10 10h4v4h-4z', multi: false });
  });

  it('concatenates multiple paths and flags multi', () => {
    const svg = '<svg><path d="M0 0h1v1z"/><path d="M2 2h1v1z"/></svg>';
    expect(extractPath(svg)).toEqual({ d: 'M0 0h1v1z M2 2h1v1z', multi: true });
  });

  it('returns null when no path is present', () => {
    expect(extractPath('<svg></svg>')).toEqual({ d: null, multi: false });
  });
});

describe('optimizePath', () => {
  it('shrinks (or preserves) valid path data', () => {
    const d = 'M 10.000 10.000 L 20.000 20.000 Z';
    const out = optimizePath(d);
    expect(out.length).toBeLessThanOrEqual(d.length);
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('assetSegment', () => {
  it('encodes the (weight, fill) variant into the gstatic segment', () => {
    expect(assetSegment(400, 0)).toBe('default');
    expect(assetSegment(400, 1)).toBe('fill1');
    expect(assetSegment(300, 0)).toBe('wght300');
    expect(assetSegment(700, 1)).toBe('wght700fill1');
  });
});

describe('svgUrl', () => {
  it('builds the official gstatic url', () => {
    expect(svgUrl('outlined', 'search', 400, 0)).toBe(
      'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/search/default/24px.svg'
    );
    expect(svgUrl('rounded', 'home', 300, 1)).toBe(
      'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/home/wght300fill1/24px.svg'
    );
  });
});
