"use client";

import { useRouter } from "next/navigation";
import { PencilSimple } from "phosphor-react";

import { serializeCategoryListSearchParams } from "@/features/metric-categories/listSearchParams";
import { useRouteParams } from "@/hooks/useRouteParams";
import { metricCategoryRoutes } from "@/lib/routes";
import Button from "@/ui/Button";
import Card from "@/ui/Card";
import DataLabel from "@/ui/DataLabel";
import { formatHuman } from "@/utils/date-io";
import { safeLabel } from "@/utils/label";

import { useMetricCategoryDetail } from "./MetricCategoryDetailContext";
import { useMetricCategoryReturnParams } from "./MetricCategoryReturnContext";

const MetricCategoryHeaderSection = () => {
  const router = useRouter();
  const category = useMetricCategoryDetail();
  const returnParams = useMetricCategoryReturnParams();
  const { categoryId } = useRouteParams<{ categoryId: string }>({ required: ["categoryId"] });

  const backHref = metricCategoryRoutes.list(
    returnParams ? serializeCategoryListSearchParams(returnParams) : undefined,
  );

  return (
    <Card className="relative w-full space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Back to categories"
          onClick={() => router.push(backHref)}
        >
          ← Back to Categories
        </Button>
        <Button
          className="rounded-full"
          variant="tertiary"
          aria-label="Edit Category"
          onClick={() => router.push(metricCategoryRoutes.modal.edit(categoryId))}
        >
          <PencilSimple size={22} />
        </Button>
      </div>

      <DataLabel
        title="NAME"
        value={safeLabel(category?.name, "Not Set")}
        size="lg"
        className="mb-2"
      />

      <div className="flex flex-row items-start gap-8">
        <DataLabel title="COLOR" value={safeLabel(category?.color, "Not Set")} />
        <DataLabel title="ICON" value={safeLabel(category?.icon, "Not Set")} />
      </div>

      <div className="mt-3 flex gap-6 text-xs text-gray-400">
        <span>
          Created at&nbsp;
          {formatHuman(category?.createdAt)}
        </span>
        <span>
          Updated at&nbsp;
          {formatHuman(category?.updatedAt)}
        </span>
      </div>
    </Card>
  );
};

export default MetricCategoryHeaderSection;
