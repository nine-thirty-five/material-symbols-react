// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import jscodeshift from 'jscodeshift';

const require = createRequire(import.meta.url);
const transform = require('../codemods/v1-to-v2.cjs') as (
  file: { source: string; path: string },
  api: {
    jscodeshift: typeof jscodeshift;
    j: typeof jscodeshift;
    stats: () => void;
    report: () => void;
  },
  options: Record<string, unknown>
) => string | null;

function run(
  source: string,
  options: Record<string, unknown> = {}
): string | null {
  const j = jscodeshift.withParser('tsx');
  const api = { jscodeshift: j, j, stats: () => {}, report: () => {} };
  return transform({ source, path: 'test.tsx' }, api, options);
}

const IMP =
  "import { Search } from '@nine-thirty-five/material-symbols-react/outlined';";

describe('v1-to-v2 codemod', () => {
  it('adds size={24} to icons relying on the v1 default size', () => {
    const out = run(`${IMP}\nconst x = <Search />;`);
    expect(out).toContain('<Search size={24} />');
  });

  it('does not add size when width/height/size is already set', () => {
    expect(run(`${IMP}\nconst x = <Search width={32} />;`)).toBeNull();
    expect(run(`${IMP}\nconst x = <Search size={16} />;`)).toBeNull();
    expect(run(`${IMP}\nconst x = <Search height="2em" />;`)).toBeNull();
  });

  it('skips elements that spread props (size may come from there)', () => {
    expect(run(`${IMP}\nconst x = <Search {...props} />;`)).toBeNull();
  });

  it('leaves non-package components untouched', () => {
    const src = "import { Search } from 'other-lib';\nconst x = <Search />;";
    expect(run(src)).toBeNull();
  });

  it('renames the 14 corrected components in imports and JSX', () => {
    const out = run(
      "import { SpeedFivex } from '@nine-thirty-five/material-symbols-react/rounded';\n" +
        'const x = <SpeedFivex />;'
    );
    expect(out).toContain('SpeedZeroFivex');
    expect(out).not.toContain('SpeedFivex }');
    expect(out).toContain('<SpeedZeroFivex size={24} />');
  });

  it('renames aliased imports but keeps the local alias', () => {
    const out = run(
      "import { Stat as Icon } from '@nine-thirty-five/material-symbols-react/outlined';\n" +
        'const x = <Icon />;'
    );
    expect(out).toContain('StatZero as Icon');
    expect(out).toContain('<Icon size={24} />');
  });

  it('respects --size=skip', () => {
    expect(run(`${IMP}\nconst x = <Search />;`, { size: 'skip' })).toBeNull();
  });
});
