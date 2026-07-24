#!/usr/bin/env node
import fs from 'fs';
import { searchIcons } from './search.js';

const USAGE = `Search the Material Symbols catalog shipped with this package.

Usage:
  npx @nine-thirty-five/material-symbols-react find <query…> [options]

Options:
  --limit, -n <N>   Maximum results to print (default 10)
  --json            Print raw JSON (name, component, categories, tags)
  --help, -h        Show this help

Examples:
  npx @nine-thirty-five/material-symbols-react find trash
  npx @nine-thirty-five/material-symbols-react find arrow back -n 5
`;

function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === 'find' || argv[0] === 'search') argv.shift();

  let limit = 10;
  let json = false;
  const query = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(USAGE);
      return;
    } else if (a === '--json') {
      json = true;
    } else if (a === '--limit' || a === '-n') {
      limit = parseInt(argv[++i], 10) || 10;
    } else {
      query.push(a);
    }
  }
  if (query.length === 0) {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }

  // bin/ and dist/ are siblings both in the published package and in the repo.
  const manifestUrl = new URL('../dist/manifest.json', import.meta.url);
  if (!fs.existsSync(manifestUrl)) {
    console.error(
      'dist/manifest.json not found — in a repo checkout, run `npm run generate:sample` first.'
    );
    process.exitCode = 1;
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestUrl, 'utf8'));
  const results = searchIcons(manifest.icons, query, limit);

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  if (results.length === 0) {
    console.log(`No icons match "${query.join(' ')}".`);
    return;
  }

  const width = Math.max(...results.map((r) => r.component.length));
  for (const r of results) {
    const cats = r.categories?.length ? `  [${r.categories.join(', ')}]` : '';
    console.log(`${r.component.padEnd(width)}  ${r.name}${cats}`);
  }
  console.log(
    `\nimport { ${results[0].component} } from '${manifest.package}/outlined';`
  );
  console.log(`Pattern: ${manifest.importPattern}`);
}

main();
