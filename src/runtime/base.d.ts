import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Sets both width and height. Defaults to "1em" so icons scale with font-size. */
  size?: number | string;
}

export type Icon = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;

declare const base: (d: string) => Icon;
export default base;
