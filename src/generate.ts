import fs from 'fs';
import {
  generateIndexFile,
  generateIconVariant,
  readFilesRecursively,
  filterExcludeIndexFile,
  parseFileForIndexGeneration,
  generateIconWrapper,
} from './generate.utils';
import path from 'path';

const nullIcons: string[] = [];

const chunkSize = 50;

async function main() {
  // CREATE icons FOLDER
  [
    './icons',
    './icons/outlined',
    './icons/outlined/filled',
    './icons/rounded',
    './icons/rounded/filled',
    './icons/sharp',
    './icons/sharp/filled',
  ].forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
  });

  // GENERATE ICON COMPONENTS
  await generateIconVariant('outlined', false, chunkSize, nullIcons);
  await generateIconVariant('rounded', false, chunkSize, nullIcons);
  await generateIconVariant('sharp', false, chunkSize, nullIcons);
  await generateIconVariant('outlined', true, chunkSize, nullIcons);
  await generateIconVariant('rounded', true, chunkSize, nullIcons);
  await generateIconVariant('sharp', true, chunkSize, nullIcons);

  // Generate types.ts
  await fs.promises.writeFile(
    './icons/types.ts',
    `
    import { SVGProps } from 'react';

    export type Variant = 'outlined' | 'sharp' | 'rounded';

    export type IconProps = SVGProps<SVGSVGElement> & {
      size?: number | string;
    };

    export type IconWrapperProps = IconProps & {
      variant?: Variant;
      filled?: boolean;
    };
    `
  );

  // GENERATE index.ts
  const variants = ['rounded', 'sharp', 'outlined'];

  for (const variant of variants) {
    const files = readFilesRecursively(`./icons/${variant}`, '.tsx');
    const filesFiltered = filterExcludeIndexFile(files);

    await generateIndexFile(
      filesFiltered.map(parseFileForIndexGeneration),
      `./icons/${variant}/index.tsx`
    );

    const filledFiles = readFilesRecursively(
      `./icons/${variant}/filled`,
      '.tsx'
    );
    const filledFiltered = filterExcludeIndexFile(filledFiles);

    await generateIndexFile(
      filledFiltered.map(parseFileForIndexGeneration),
      `./icons/${variant}/filled/index.tsx`
    );
  }

  // GENERATE icons wrappers
  const outlinedFiles = readFilesRecursively('./icons/outlined', '.tsx');
  const outlinedFiltered = filterExcludeIndexFile(outlinedFiles);
  const fileNames = outlinedFiltered.map((p) => path.basename(p, '.tsx'));

  for (const name of fileNames) {
    await generateIconWrapper(name, './icons');
  }

  await generateIndexFile(
    outlinedFiltered.map(parseFileForIndexGeneration),
    `./icons/index.tsx`
  );

  // Log null icons
  console.log('Null icon urls', nullIcons);
}

main();
