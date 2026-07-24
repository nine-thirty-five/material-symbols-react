export interface ManifestIcon {
  /** Material Symbols name (snake_case). */
  name: string;
  /** Exported component identifier (PascalCase). */
  component: string;
  categories: string[];
  tags: string[];
}

/**
 * Rank `icons` against query terms. Every term must match somewhere
 * (name, component, tags or categories) for an icon to qualify.
 */
export declare function searchIcons(
  icons: ManifestIcon[],
  query: string[],
  limit?: number
): ManifestIcon[];
