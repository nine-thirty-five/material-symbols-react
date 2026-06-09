/**
 * Codemod: upgrade a codebase from @nine-thirty-five/material-symbols-react v1 -> v2.
 *
 * Two v2 breaking changes are handled:
 *
 *   1. Default icon size changed from a fixed `24` to `1em` (so icons now scale
 *      with font-size). To preserve v1's appearance, this adds `size={24}` to
 *      every icon element that doesn't already set `size`, `width`, or `height`.
 *      Skip this with `--size=skip` if you want the new `1em` behaviour.
 *
 *   2. 14 icon component names changed (a v1 bug dropped a bare `0`, so e.g.
 *      `speed_0_5x` collided/normalised wrong). Their imports and JSX usages are
 *      renamed to the corrected v2 names.
 *
 * Import paths are NOT changed: v1 paths (`/outlined`, `/outlined/filled`, …)
 * still work in v2 as aliases for weight 400.
 *
 * Usage (TypeScript/TSX):
 *   npx jscodeshift -t node_modules/@nine-thirty-five/material-symbols-react/codemods/v1-to-v2.cjs --parser tsx src/
 * For plain JS/JSX use `--parser babel`.
 */

'use strict';

const PKG = '@nine-thirty-five/material-symbols-react';

/** v1 component name -> v2 component name (the bare-zero fix). */
const RENAMES = {
  BatteryBar: 'BatteryZeroBar',
  BatteryAndroid: 'BatteryAndroidZero',
  BatteryHoriz: 'BatteryHorizZero',
  Counter: 'CounterZero',
  SignalCellularBar: 'SignalCellularZeroBar',
  SignalCellularConnectedNoInternetBar:
    'SignalCellularConnectedNoInternetZeroBar',
  SignalWifiBar: 'SignalWifiZeroBar',
  SpeedTwentyFive: 'SpeedZeroTwentyFive',
  SpeedTwox: 'SpeedZeroTwox',
  SpeedFive: 'SpeedZeroFive',
  SpeedFivex: 'SpeedZeroFivex',
  SpeedSeventyFive: 'SpeedZeroSeventyFive',
  SpeedSevenx: 'SpeedZeroSevenx',
  Stat: 'StatZero',
};

function isPackageSource(value) {
  return typeof value === 'string' && (value === PKG || value.startsWith(PKG + '/'));
}

module.exports = function transform(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const addSize = options.size !== 'skip';

  let changed = false;
  // Local identifiers bound to package icons in this file.
  const iconLocals = new Set();

  // --- Pass 1: imports (collect locals, apply renames) ---------------------
  root.find(j.ImportDeclaration).forEach((path) => {
    if (!isPackageSource(path.node.source.value)) return;

    for (const spec of path.node.specifiers || []) {
      if (spec.type !== 'ImportSpecifier') continue;

      const importedName = spec.imported.name;
      const localName = spec.local ? spec.local.name : importedName;
      const renamed = RENAMES[importedName];

      if (!renamed) {
        iconLocals.add(localName);
        continue;
      }

      changed = true;
      const wasAliased = localName !== importedName;
      spec.imported = j.identifier(renamed);

      if (wasAliased) {
        // `import { OldName as X }` -> `import { NewName as X }`; usages of X stay.
        spec.local = j.identifier(localName);
        iconLocals.add(localName);
      } else {
        // `import { OldName }` -> `import { NewName }`; rename JSX usages too.
        spec.local = j.identifier(renamed);
        renameJsxElement(root, j, localName, renamed);
        iconLocals.add(renamed);
      }
    }
  });

  // --- Pass 2: preserve the v1 default size (24px) -------------------------
  if (addSize && iconLocals.size > 0) {
    root.find(j.JSXOpeningElement).forEach((path) => {
      const nameNode = path.node.name;
      if (nameNode.type !== 'JSXIdentifier' || !iconLocals.has(nameNode.name)) {
        return;
      }

      const attrs = path.node.attributes || [];
      const hasAttr = (name) =>
        attrs.some(
          (a) =>
            a.type === 'JSXAttribute' &&
            a.name &&
            a.name.type === 'JSXIdentifier' &&
            a.name.name === name
        );
      const hasSpread = attrs.some((a) => a.type === 'JSXSpreadAttribute');

      // Already sized explicitly, or a spread might inject size — leave it alone.
      if (hasSpread || hasAttr('size') || hasAttr('width') || hasAttr('height')) {
        return;
      }

      attrs.push(
        j.jsxAttribute(
          j.jsxIdentifier('size'),
          j.jsxExpressionContainer(j.literal(24))
        )
      );
      path.node.attributes = attrs;
      changed = true;
    });
  }

  return changed ? root.toSource({ quote: 'single' }) : null;
};

/** Rename `<From …>`/`</From>` element names to `to`. */
function renameJsxElement(root, j, from, to) {
  root.find(j.JSXOpeningElement).forEach((p) => {
    if (p.node.name.type === 'JSXIdentifier' && p.node.name.name === from) {
      p.node.name.name = to;
    }
  });
  root.find(j.JSXClosingElement).forEach((p) => {
    if (p.node.name.type === 'JSXIdentifier' && p.node.name.name === from) {
      p.node.name.name = to;
    }
  });
}

module.exports.RENAMES = RENAMES;
