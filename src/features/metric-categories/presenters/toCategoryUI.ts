import { CATEGORY_DEFAULTS } from "../constants";
import type { MetricCategoryUI, MetricCategoryVM } from "../view-models";

const isHex = (v?: string | null) => !!v && /^#?[0-9A-Fa-f]{6}$/.test(v);

export function toCategoryUI(vm?: MetricCategoryVM | null): MetricCategoryUI {
  const name = vm?.name?.trim() || CATEGORY_DEFAULTS.name;
  const icon = vm?.icon || CATEGORY_DEFAULTS.icon;
  const color: `#${string}` = isHex(vm?.color)
    ? vm!.color!.startsWith("#")
      ? (vm!.color! as `#${string}`)
      : (`#${vm!.color!}` as `#${string}`)
    : CATEGORY_DEFAULTS.color;

  return {
    id: vm?.id ?? undefined,
    name,
    icon,
    color,
  };
}
