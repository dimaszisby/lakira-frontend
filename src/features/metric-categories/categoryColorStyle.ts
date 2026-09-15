import type { CSSProperties } from "react";

/**
 * Pass a category's colour to `.category-color-bg` as a custom property.
 *
 * A category colour is user data, so it cannot be a token and cannot be a
 * class. Setting `backgroundColor` inline would put styling in the markup where
 * no recipe can reach it; a custom property passes only the datum and leaves the
 * rule in `category-color.recipe.css`. Same shape as `ColorField`'s `--swatch`.
 */
export const categoryColorStyle = (color: string): CSSProperties =>
  ({ "--category-color": color }) as CSSProperties;
