import { Files } from "phosphor-react";
import React from "react";

interface Props {
  title: string;
  description: string;
  tooltip?: string;
}

const EmptyDataIndicator = ({ title, description, tooltip }: Props) => {
  return (
    <div className="mt-8 text-center text-gray-600">
      <div
        className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6"
        aria-label="Empty State Container"
        role="region"
      >
        {/* Card */}
        <div
          className="flex min-h-[320px] w-full max-w-xs flex-col items-center justify-center space-y-4 rounded-2xl bg-white p-8 shadow-lg"
          aria-label="Empty State Card"
          role="banner"
        >
          <Files size={48} />
          <h2 className="text-center text-xl font-semibold text-gray-800">
            {title || "No Data Available"}
          </h2>
          <p className="text-center text-base text-gray-500">
            {description || "You haven't created any data yet."}
          </p>
        </div>

        {/* Tooltip */}
        {tooltip ? (
          <div
            className="wraps flex items-center rounded-xl bg-status-info px-4 py-2 text-center text-sm text-white"
            aria-label="Tooltip"
            role="tooltip"
          >
            <span>{tooltip || "Create your first data"}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EmptyDataIndicator;
