import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { glob } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default [
  {
    input: Object.fromEntries(
      glob
        .sync('icons/**/*.tsx')
        .map((file) => [
          path.relative(
            'icons',
            file.slice(0, file.length - path.extname(file).length)
          ),
          fileURLToPath(new URL(file, import.meta.url)),
        ])
    ),
    output: {
      format: 'esm',
      sourcemap: false,
      dir: 'dist/esm',
      preserveModules: true,
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
  },
  {
    input: Object.fromEntries(
      glob
        .sync('icons/**/index.tsx')
        .map((file) => [
          path.relative(
            'icons',
            file.slice(0, file.length - path.extname(file).length)
          ),
          fileURLToPath(new URL(file, import.meta.url)),
        ])
    ),
    output: [{ dir: 'dist/esm', format: 'esm' }],
    plugins: [dts()],
  },
];
