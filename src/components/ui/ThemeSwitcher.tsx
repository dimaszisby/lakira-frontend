"use client";

import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";

import type { SegmentOption } from "@/ui/SegmentedControl";
import { SegmentedControl } from "@/ui/SegmentedControl";

type ThemeValue = "system" | "light" | "dark";

const THEME_OPTIONS: SegmentOption<ThemeValue>[] = [
  { value: "system", label: "System", description: "Follow your device appearance setting" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const isThemeValue = (value: string | undefined): value is ThemeValue =>
  value === "system" || value === "light" || value === "dark";

/**
 * `false` while server-rendering and through hydration, `true` afterwards.
 *
 * `useSyncExternalStore` reads `getServerSnapshot` during hydration and
 * `getSnapshot` after it, which is exactly the distinction needed here. The
 * `useState` + `useEffect` version of this is the more familiar idiom but sets
 * state synchronously inside an effect, which this repo's lint rules reject as a
 * cascading render.
 */
const subscribe = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

export type ThemeSwitcherProps = {
  className?: string;
};

/**
 * Light / dark / system selector.
 *
 * The provider in `src/app/providers.tsx` owns persistence and the `data-theme`
 * attribute, and the inline script next-themes injects applies the stored choice
 * before first paint. This component only reads and writes the preference.
 *
 * Until it has mounted, the control renders unselected and disabled rather than
 * absent: `useTheme()` has no value on the server or on the first client render,
 * and returning `null` there would grow the card by the control's height on
 * hydration. See D-02 in `docs/internal/initiatives/theme-switching/decisions.md`.
 */
export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(subscribe, getHydratedSnapshot, getServerSnapshot);
  const labelId = useId();

  return (
    <div className={className}>
      <span id={labelId} className="mb-2 block text-body2 font-medium text-ink">
        Theme
      </span>

      <SegmentedControl
        aria-labelledby={labelId}
        options={THEME_OPTIONS}
        value={isMounted && isThemeValue(theme) ? theme : null}
        onChange={setTheme}
        disabled={!isMounted}
        fullWidth={false}
      />
    </div>
  );
};
