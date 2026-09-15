import type { CSSProperties } from "react";

/**
 * Pass a computed chart height to `.chart-box` as a custom property.
 *
 * The unit has to be explicit here. React appends `px` to a bare number given
 * to `style={{ height }}`, but a custom property is an opaque string to React
 * and would be handed to CSS as `260`, which is invalid for `height`.
 */
export const chartHeightStyle = (height: number): CSSProperties =>
  ({ "--chart-height": `${height}px` }) as CSSProperties;
