module.exports = {
  // Check Typescript files
  '**/*.(ts|tsx|js)': () => 'tsc --noEmit',

  // Lint and format TypeScript and JavaScript files
  '**/*.(ts|tsx|js|js)': (filenames) => [
    `eslint --fix ${filenames.map((filename) => `"${filename}"`).join(' ')}`,
    `prettier --write ${filenames
      .map((filename) => `"${filename}"`)
      .join(' ')}`,
  ],

  // Format MarkDown and JSON
  '**/*.(md|json)': (filenames) =>
    `prettier --write ${filenames
      .map((filename) => `"${filename}"`)
      .join(' ')}`,
};
