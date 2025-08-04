import fs from 'fs';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';

type Variant = 'outlined' | 'sharp' | 'rounded';

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function toPascalCase(string: string) {
  return string
    .split('/')
    .map((snake) =>
      snake
        .split('_')
        .map((substr) => substr.charAt(0).toUpperCase() + substr.slice(1))
        .join('')
    )
    .join('/');
}

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const result: T[][] = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
}

function convertNumbersToWords(input: string): string {
  const numericalWords: Record<string, string> = {
    '0': 'Zero',
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
  };

  const tensWords: Record<string, string> = {
    '10': 'Ten',
    '11': 'Eleven',
    '12': 'Twelve',
    '13': 'Thirteen',
    '14': 'Fourteen',
    '15': 'Fifteen',
    '16': 'Sixteen',
    '17': 'Seventeen',
    '18': 'Eighteen',
    '19': 'Nineteen',
  };

  const tensMultipleWords: Record<string, string> = {
    '2': 'Twenty',
    '3': 'Thirty',
    '4': 'Forty',
    '5': 'Fifty',
    '6': 'Sixty',
    '7': 'Seventy',
    '8': 'Eighty',
    '9': 'Ninety',
  };

  function convertThreeDigitNumberToWords(num: number): string {
    let result = '';

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;

    if (hundreds > 0) {
      result += numericalWords[hundreds.toString()] + 'Hundred';

      if (remainder > 0) {
        result += '';
      }
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += numericalWords[remainder.toString()];
      } else if (remainder < 20) {
        result += tensWords[remainder.toString()];
      } else {
        const tens = Math.floor(remainder / 10);
        const ones = remainder % 10;

        result += tensMultipleWords[tens.toString()];

        if (ones > 0) {
          result += '' + numericalWords[ones.toString()];
        }
      }
    }

    return result;
  }

  return input.replace(/\d+/g, (match) =>
    convertThreeDigitNumberToWords(parseInt(match, 10))
  );
}

function extractContent(svgString: string) {
  const pathRegex = /<path[^>]*\sd="([^"]*)"/i;
  const match = pathRegex.exec(svgString);
  if (match && match[1]) {
    return match[1].trim();
  } else {
    console.error(
      "No 'd' attribute found in the <path> element of the input string."
    );
    return null;
  }
}

async function getIconList(
  browser: Browser,
  variant?: Variant
): Promise<string[]> {
  const page = await browser.newPage();

  await page.goto(
    variant
      ? `https://fonts.google.com/icons?icon.style=${capitalize(variant)}`
      : 'https://fonts.google.com/icons'
  );

  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);

  const iconList = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('gf-load-icon-font'));

    return spans.map((span) => span.textContent?.trim() ?? '');
  });

  return iconList.filter((name) => !!name);
}

async function scraper(browser: Browser, url: string): Promise<string | null> {
  const newPage = await browser.newPage();
  await newPage.goto(encodeURI(url));

  const content = await newPage.evaluate(() => {
    const element = document.querySelector('svg');

    if (element) {
      return element.outerHTML;
    }
    return null;
  });
  newPage.close();

  return content;
}

async function getIconsSVG(
  browser: Browser,
  iconNames: string[],
  variant: Variant,
  isFilled: boolean,
  chunkSize: number,
  nullIcons: string[]
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
        const url = `https://fonts.gstatic.com/s/i/short-term/release/materialsymbols${variant}/${name}/${
          isFilled ? 'fill1' : 'default'
        }/24px.svg`;
        console.log;

        const content = await scraper(browser, url);

        if (!content) nullIcons.push(url);

        return {
          name,
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
      import React from "react";
      import { IconProps } from "${
        folder.includes('filled') ? '../../types' : '../types'
      }";

      const ${componentName} = (props: IconProps) => {
        return <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 -960 960 960" fill="currentColor" {...props} >
          <path d="${extractContent(svg)}" />
        </svg>
      };

      export default ${componentName};
    `
  );
}

export async function generateIconVariant(
  variant: Variant,
  isFilled: boolean,
  chunkSize: number,
  nullIcons: string[],
  iconList?: string[]
) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

  try {
    if (!iconList) {
      iconList = await getIconList(browser, variant);
    }

    const iconSVGs = await getIconsSVG(
      browser,
      iconList,
      variant,
      isFilled,
      chunkSize,
      nullIcons
    );

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
            toPascalCase(convertNumbersToWords(svg.name)),
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

export async function generateIndexFile(
  files: { name: string; path: string }[],
  destinationPath: string
) {
  return fs.promises.writeFile(
    destinationPath,
    `${files
      .map(
        (file) =>
          `import ${toPascalCase(convertNumbersToWords(file.name))} from '${
            file.path
          }';\n`
      )
      .join('')}\nexport {\n${files
      .map((file) => `${toPascalCase(convertNumbersToWords(file.name))},\n`)
      .join('')}}
    `
  );
}

export function readFilesRecursively(
  folderPath: string,
  fileExtension: string
): string[] {
  const files: string[] = [];

  const readDir = (currentPath: string): void => {
    const items = fs.readdirSync(currentPath);

    items.forEach((item) => {
      const fullPath = path.join(currentPath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isFile() && path.extname(item) === fileExtension) {
        files.push(fullPath);
      }
    });
  };

  readDir(folderPath);

  return files;
}

export async function generateIconWrapper(name: string, outputDir: string) {
  const pascal = toPascalCase(convertNumbersToWords(name));
  const wrapper = `
  import React from 'react'
  import { IconWrapperProps } from './types'

  export const ${pascal} = ({ variant = 'outlined', filled, ...props }: IconWrapperProps) => {
    const importPath = \`./\${variant}\${filled ? "/filled" : ""}/${pascal}\`;

    const LazyIcon = React.useMemo(
      () => React.lazy(() => import(importPath)),
      [importPath]
    )

    return (
      <React.Suspense fallback={null}>
        <LazyIcon {...props} />
      </React.Suspense>
    )
  }
  export default ${pascal}
  `.trim();
  await fs.promises.writeFile(path.join(outputDir, `${pascal}.tsx`), wrapper);
}

export function filterExcludeIndexFile(files: string[]): string[] {
  return files.filter((file) => {
    const posix = file.replace(/\\/g, '/');
    return path.basename(posix) !== 'index.tsx';
  });
}

export function parseFileForIndexGeneration(file: string): {
  name: string;
  path: string;
} {
  const posix = file.replace(/\\/g, '/');
  const name = posix.substring(
    posix.lastIndexOf('/') + 1,
    posix.lastIndexOf('.')
  );
  const relPath = `./${name}`;

  return {
    name,
    path: relPath,
  };
}
