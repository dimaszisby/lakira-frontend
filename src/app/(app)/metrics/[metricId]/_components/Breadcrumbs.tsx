"use client";

import Link from "next/link";
import { memo } from "react";

import { metricCategoryRoutes, metricRoutes } from "@/lib/routes";
import Card from "@/ui/Card";

import { useMetricDetail } from "./MetricDetailContext";

const BreadcrumbsBase = () => {
  const { header } = useMetricDetail();
  const category = header.category;

  return (
    <Card size="xs" className="w-full">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-row items-center text-caption text-ink-tertiary">
          <li>
            <Link href={metricRoutes.list()} className="hover:underline">
              Metric Library
            </Link>
            <span className="mx-2">/</span>
          </li>

          {category ? (
            <li>
              <Link href={metricCategoryRoutes.detail(category.id)} className="hover:underline">
                {category.name}
              </Link>
              <span className="mx-4">/</span>
            </li>
          ) : (
            <li>
              <span>Uncategorized</span>
              <span className="mx-4">/</span>
            </li>
          )}

          <li className="text-brand-primary">{header.name}</li>
        </ol>
      </nav>
    </Card>
  );
};
BreadcrumbsBase.displayName = "MetricBreadcrumbs";

const Breadcrumbs = memo(BreadcrumbsBase);
Breadcrumbs.displayName = "MetricBreadcrumbs";

export default Breadcrumbs;
