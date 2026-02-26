"use client";

import { CaretDown } from "phosphor-react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import type { BucketAlias } from "../types";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  value: BucketAlias;
  onChange: (next: BucketAlias) => void;
};

const GranularityPicker = ({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
  ...rest
}: Props) => {
  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label={ariaLabel ?? "Granularity"}
        className={cn(
          "w-full appearance-none rounded-xl border border-border bg-bg py-2 pl-3 pr-6 text-sm outline-none ring-0 focus:border-brand-accent",
          className,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value as BucketAlias)}
        {...rest}
      >
        <option value="1h">Hourly</option>
        <option value="1d">Daily</option>
        <option value="1w">Weekly</option>
        <option value="1m">Monthly</option>
        <option value="1y">Yearly</option>
      </select>

      <span
        className="pointer-events-none absolute inset-y-0 right-2 flex items-center"
        aria-hidden="true"
      >
        <CaretDown size={14} className="text-brand-accent" />
      </span>
    </div>
  );
};

export default GranularityPicker;
