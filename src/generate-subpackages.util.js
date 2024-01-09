// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const variants = [
  'rounded',
  'sharp',
  'outlined',
  'rounded/filled',
  'sharp/filled',
  'outlined/filled',
];

async function generateFile(folderName) {
  if (folderName.includes('/')) {
    return fs.promises.writeFile(
      `./dist/esm/${folderName}/package.json`,
      `{
  "name": "@nine-thirty-five/material-symbols-react/${folderName}",
  "main": "./index.js",
  "module": "./index.js",
  "types": "./index.d.ts",
  "peerDependencies": {
    "react": "^18.2.0"
  }
}
`
    );
  }
  return fs.promises.writeFile(
    `./dist/esm/${folderName}/package.json`,
    `{
  "name": "@nine-thirty-five/material-symbols-react/${folderName}",
  "main": "./index.js",
  "module": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    "./${folderName}": "./dist/esm/${folderName}/index.js"
  },
  "typesVersions": {
    "*": {
      "${folderName}": ["./dist/esm/${folderName}/index.js"]
    }
  },
  "peerDependencies": {
    "react": "^18.2.0"
  }
}
`
  );
}

async function main() {
  await Promise.all(variants.map((variant) => generateFile(variant)));
}

main();
