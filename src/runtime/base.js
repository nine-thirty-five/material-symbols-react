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
 * Accessibility: icons are decorative by default (`aria-hidden="true"`).
 * Passing `title`, `aria-label` or `aria-labelledby` makes the icon
 * semantic instead: it gets `role="img"`, and `title` renders an SVG
 * `<title>` as the accessible name.
 *
 * @param {string} d - SVG path data.
 * @returns {import('./base').Icon}
 */
const base = (d) =>
  forwardRef(function Icon({ size = '1em', title, ...props }, ref) {
    const labelled =
      title != null ||
      props['aria-label'] != null ||
      props['aria-labelledby'] != null;
    return createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 -960 960 960',
        width: size,
        height: size,
        fill: 'currentColor',
        'aria-hidden': labelled ? undefined : true,
        role: labelled ? 'img' : undefined,
        ...props,
        ref,
      },
      title ? createElement('title', null, title) : null,
      createElement('path', { d })
    );
  });

export default base;
