"use client";

import type { SelectHTMLAttributes } from "react";

import type { BucketAlias } from "../types";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  value: BucketAlias;
  onChange: (next: BucketAlias) => void;
};

const GranularityPicker = ({ value, onChange, ...rest }: Props) => {
  return (
    <select
      aria-label="Granularity"
      className="bg-background rounded-md border px-2 py-1"
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
  );
};

export default GranularityPicker;
