"use client";

import { Link } from "phosphor-react";
import { memo } from "react";

import type { MetricDetailCompositeVM } from "@/features/metrics/view-models";

interface Props {
  category: MetricDetailCompositeVM["header"]["category"];
  metricName: string;
}

export const BreadcrumbsBase = ({ category, metricName }: Props) => (
  <nav className="w-full rounded-2xl bg-white px-6 py-4" aria-label="Breadcrumb">
    <ol className="flex items-center gap-4 text-sm font-medium text-gray-500">
      <li>
        <Link href="/metrics" className="hover:underline">
          Metric Library
        </Link>
        <span className="mx-2">/</span>
      </li>

      {category !== null ? (
        <li className="flex gap-4">
          <Link href={`/category/${category.id}`} className="hover:underline">
            {category.name}
          </Link>
          <span>/</span>
        </li>
      ) : (
        <li className="flex gap-4">
          <span>Uncategorized</span>
          <span>/</span>
        </li>
      )}

      <li className="truncate font-semibold text-[#EA5678]">{metricName}</li>
    </ol>
  </nav>
);
BreadcrumbsBase.displayName = "Breadcrumbs";

const Breadcrumbs = memo(BreadcrumbsBase);
Breadcrumbs.displayName = "Breadcrumbs";
export default Breadcrumbs;
