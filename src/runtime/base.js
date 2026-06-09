import { createElement, forwardRef } from 'react';

/**
 * Shared icon factory. Every generated icon is `base("<path d>")`.
 * Plain ESM (React.createElement, no JSX) so it ships to `dist` with no
 * compile step. This file is the single source of truth and is copied verbatim
 * to `dist/_base.js` by the generator.
 *
 * Wrapped in `forwardRef` so `<Icon ref={…} />` reaches the underlying `<svg>`
 * in both React 18 and 19.
 *
 * @param {string} d - SVG path data.
 * @returns {import('./base').Icon}
 */
const base = (d) =>
  forwardRef(function Icon({ size = '1em', ...props }, ref) {
    return createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 -960 960 960',
        width: size,
        height: size,
        fill: 'currentColor',
        ...props,
        ref,
      },
      createElement('path', { d })
    );
  });

export default base;
