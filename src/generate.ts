import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import {
  chunkArray,
  convertNumbersToWords,
  readFilesRecursively,
} from './generate.utils';

const chunkSize = 100;

async function getIconList(
  browser: Browser,
  variant?: 'outlined' | 'sharp' | 'rounded'
): Promise<string[]> {
  const page = await browser.newPage();

  await page.goto(
    variant
      ? `https://fonts.google.com/icons?icon.style=${variant}`
      : 'https://fonts.google.com/icons'
  );

  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);

  const iconList = await page.evaluate(() => {
    const spans = Array.from(
      document.querySelectorAll('span.icon-name.mat-caption')
    );

    return spans.map((span) => span.textContent?.trim() ?? '');
  });

  return iconList.filter((name) => !!name);
}

async function getIconsSVG(
  browser: Browser,
  iconNames: string[],
  variant: 'outlined' | 'sharp' | 'rounded',
  isFilled: boolean
): Promise<{ name: string; content: string }[]> {
  const iconListChunks = chunkArray(iconNames, chunkSize);
  let svgData: { name: string; content: string }[] = [];
  let count = 1;

  for (const chunk of iconListChunks) {
    console.log(
      `Extracting ${variant}${isFilled ? '-filled' : ''} SVG ${
        count * chunkSize > iconNames.length
          ? iconNames.length
          : count * chunkSize
      } out of ${iconNames.length}`
    );
    const data = await Promise.all(
      chunk.map(async (name) => {
        const snakeCaseName = name.replace(/\s+/g, '_').toLowerCase();
        const newPage = await browser.newPage();
        await newPage.goto(
          encodeURI(
            `https://fonts.gstatic.com/s/i/short-term/release/materialsymbols${variant}/${snakeCaseName}/${
              isFilled ? 'fill1' : 'default'
            }/24px.svg`
          )
        );

        const content = await newPage.evaluate(() => {
          const element = document.querySelector('svg');

          if (element) {
            return element.outerHTML;
          }
          return 'No SVG';
        });
        newPage.close();

        return {
          name: convertNumbersToWords(name),
          content: content ?? 'No SVG',
        };
      })
    );

    svgData = svgData.concat(data);
    count++;
  }

  return svgData.filter((data) => data.content !== 'No SVG');
}

async function svgToComponent(name: string, svg: string, folder: string) {
  const componentName = name.replace(/\s+/g, '');

  return fs.promises.writeFile(
    `./icons/${folder}/${componentName}.tsx`,
    `
      import React, { SVGProps } from "react";

      const ${componentName}: React.FC<SVGProps<SVGSVGElement>> = (props) => {
        return ${svg.replace(
          /<svg[\s\S]*?>/g,
          '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 -960 960 960" fill="currentColor" {...props} >'
        )};
      };

      export default ${componentName};
    `
  );
}

async function generateIconVariant(
  variant: 'outlined' | 'sharp' | 'rounded',
  isFilled: boolean,
  iconList?: string[]
) {
  const browser = await puppeteer.launch();

  try {
    if (!iconList) {
      iconList = await getIconList(browser, variant);
    }

    const iconSVGs = await getIconsSVG(browser, iconList, variant, isFilled);

    const iconSVGChunks = chunkArray(iconSVGs, chunkSize);
    let count = 1;

    for (const chunk of iconSVGChunks) {
      console.log(
        `Saving ${variant}${isFilled ? '-filled' : ''} SVG ${
          count * chunkSize > iconSVGs.length
            ? iconSVGs.length
            : count * chunkSize
        } out of ${iconSVGs.length}`
      );

      await Promise.all(
        chunk.map((svg) =>
          svgToComponent(
            `${svg.name}`,
            svg.content,
            `${variant}${isFilled ? '/filled' : ''}`
          )
        )
      );

      count++;
    }
  } catch (error) {
    console.error(
      `Failed to generate ${variant}${isFilled ? '-filled' : ''} variants`,
      error
    );
  } finally {
    await browser.close();
  }
}

async function generateIndexFile(
  files: { name: string; path: string }[],
  destinationPath: string
) {
  return fs.promises.writeFile(
    destinationPath,
    `${files
      .map((file) => `import ${file.name} from '${file.path}';\n`)
      .join('')}\nexport {\n${files.map((file) => `${file.name},\n`).join('')}}
    `
  );
}

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
  await generateIconVariant('outlined', false);
  await generateIconVariant('rounded', false);
  await generateIconVariant('sharp', false);
  await generateIconVariant('outlined', true);
  await generateIconVariant('rounded', true);
  await generateIconVariant('sharp', true);

  // GENERATE index.ts
  const variants = ['rounded', 'sharp', 'outlined'];

  for (const variant of variants) {
    const files = readFilesRecursively(`./icons/${variant}`, '.tsx');
    await generateIndexFile(
      files.map((path) => {
        return {
          path: `./${path.split('/').at(-1)?.split('.')[0] ?? ''}`,
          name: path.split('/').at(-1)?.split('.')[0] ?? '',
        };
      }),
      `./icons/${variant}/index.ts`
    );

    const filledFiles = readFilesRecursively(
      `./icons/${variant}/filled`,
      '.tsx'
    );
    await generateIndexFile(
      filledFiles.map((path) => {
        return {
          path: `./${path.split('/').at(-1)?.split('.')[0] ?? ''}`,
          name: path.split('/').at(-1)?.split('.')[0] ?? '',
        };
      }),
      `./icons/${variant}/filled/index.ts`
    );
  }
}

main();
