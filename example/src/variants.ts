import type { ComponentType, SVGProps } from 'react';

export type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;
export type IconModule = Record<string, IconComponent>;

export const STYLES = ['outlined', 'rounded', 'sharp'] as const;
export const WEIGHTS = [100, 200, 300, 400, 500, 600, 700] as const;
export const FILLS = [0, 1] as const;

export type Style = (typeof STYLES)[number];
export type Weight = (typeof WEIGHTS)[number];
export type Fill = (typeof FILLS)[number];

const PKG = '@nine-thirty-five/material-symbols-react';

export const variantKey = (style: Style, weight: Weight, fill: Fill): string =>
  `${style}-${weight}${fill ? '-filled' : ''}`;

/** The exact import path a consumer would write for this variant. */
export const importPath = (style: Style, weight: Weight, fill: Fill): string =>
  `${PKG}/${style}/${weight}${fill ? '/filled' : ''}`;

/**
 * One statically-analyzable dynamic import per variant (3 styles x 7 weights x
 * 2 fills = 42). Only the selected variant is fetched at runtime, so the demo
 * stays light despite covering the whole matrix.
 */
export const loaders: Record<string, () => Promise<IconModule>> = {
  'outlined-100': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/100'),
  'outlined-100-filled': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/100/filled'),
  'outlined-200': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/200'),
  'outlined-200-filled': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/200/filled'),
  'outlined-300': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/300'),
  'outlined-300-filled': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/300/filled'),
  'outlined-400': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/400'),
  'outlined-400-filled': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/400/filled'),
  'outlined-500': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/500'),
  'outlined-500-filled': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/500/filled'),
  'outlined-600': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/600'),
  'outlined-600-filled': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/600/filled'),
  'outlined-700': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/700'),
  'outlined-700-filled': () =>
    import('@nine-thirty-five/material-symbols-react/outlined/700/filled'),
  'rounded-100': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/100'),
  'rounded-100-filled': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/100/filled'),
  'rounded-200': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/200'),
  'rounded-200-filled': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/200/filled'),
  'rounded-300': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/300'),
  'rounded-300-filled': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/300/filled'),
  'rounded-400': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/400'),
  'rounded-400-filled': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/400/filled'),
  'rounded-500': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/500'),
  'rounded-500-filled': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/500/filled'),
  'rounded-600': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/600'),
  'rounded-600-filled': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/600/filled'),
  'rounded-700': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/700'),
  'rounded-700-filled': () =>
    import('@nine-thirty-five/material-symbols-react/rounded/700/filled'),
  'sharp-100': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/100'),
  'sharp-100-filled': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/100/filled'),
  'sharp-200': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/200'),
  'sharp-200-filled': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/200/filled'),
  'sharp-300': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/300'),
  'sharp-300-filled': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/300/filled'),
  'sharp-400': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/400'),
  'sharp-400-filled': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/400/filled'),
  'sharp-500': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/500'),
  'sharp-500-filled': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/500/filled'),
  'sharp-600': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/600'),
  'sharp-600-filled': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/600/filled'),
  'sharp-700': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/700'),
  'sharp-700-filled': () =>
    import('@nine-thirty-five/material-symbols-react/sharp/700/filled'),
};

export const loadVariant = (
  style: Style,
  weight: Weight,
  fill: Fill
): Promise<IconModule> => loaders[variantKey(style, weight, fill)]();
