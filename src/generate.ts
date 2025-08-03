import fs from 'fs';
import {
  generateIndexFile,
  generateIconVariant,
  readFilesRecursively,
  filterExcludeIndexFile,
  parseFileForIndexGeneration,
} from './generate.utils';

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

    export type IconProps = SVGProps<SVGSVGElement>;
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

  // Log null icons
  console.log('Null icon urls', nullIcons);
}

main();
