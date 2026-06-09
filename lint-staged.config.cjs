const fs = require('fs');

// lint-staged passes absolute paths of staged files. Skip symlinks (e.g.
// CLAUDE.md / .github/copilot-instructions.md -> AGENTS.md): prettier errors on
// explicitly-passed symlinks, and their target gets formatted on its own.
const realFiles = (filenames) =>
  filenames.filter((f) => {
    try {
      return !fs.lstatSync(f).isSymbolicLink();
    } catch {
      return true;
    }
  });

const quote = (files) => files.map((f) => `"${f}"`).join(' ');

module.exports = {
  // Typecheck the project, then lint + format changed source files.
  '**/*.{ts,tsx,js,jsx}': (filenames) => {
    const files = realFiles(filenames);
    const cmds = ['tsc --noEmit'];
    if (files.length) {
      cmds.push(`eslint --fix ${quote(files)}`);
      cmds.push(`prettier --write ${quote(files)}`);
    }
    return cmds;
  },

  // Format Markdown and JSON (skipping symlinks).
  '**/*.{md,json}': (filenames) => {
    const files = realFiles(filenames);
    return files.length ? [`prettier --write ${quote(files)}`] : [];
  },
};
