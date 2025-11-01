import { WarningCircle } from "phosphor-react";
import type { HTMLAttributes, LabelHTMLAttributes, ReactElement } from "react";
import React, { cloneElement, createContext, useContext, useId } from "react";

import { cn } from "@/src/lib/cn";

type Ctx = { id: string; descId?: string; errId?: string; invalid?: boolean };

const FormFieldCtx = createContext<Ctx | null>(null);
const useFF = () => {
  const v = useContext(FormFieldCtx);
  if (!v) throw new Error("FormField.* must be used inside <FormField>");
  return v;
};

type RootProps = {
  id?: string;
  invalid?: boolean;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const FormField = ({
  id: idProp,
  invalid,
  className,
  children,
  description,
  error,
  ...rest
}: RootProps) => {
  const rid = useId();
  const id = idProp ?? `ff-${rid}`;
  const descId = description ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;

  return (
    <FormFieldCtx.Provider value={{ id, descId, errId, invalid }}>
      <div className={cn("flex flex-col space-y-1.5", className)} {...rest}>
        {children}

        {description ? (
          <p id={descId} className="text-xs text-gray-500">
            {description}
          </p>
        ) : null}

        {error ? (
          <div className="inline-flex min-h-[1rem] items-start gap-2">
            <WarningCircle aria-hidden className={cn("mt-[1px] h-4 w-4 shrink-0 text-red-600")} />
            <p id={errId} className="text-xs text-red-600" aria-live="polite">
              {error}
            </p>
          </div>
        ) : null}
      </div>
    </FormFieldCtx.Provider>
  );
};

// ===== Label
type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;
const FFLabel = ({ className, ...props }: LabelProps) => {
  const { id } = useFF();
  return (
    <label
      htmlFor={id}
      className={cn("block text-sm font-medium text-gray-700", className)}
      {...props}
    />
  );
};
FormField.Label = FFLabel;

// ===== Control
// Make the child’s props indexable so cloneElement can accept arbitrary keys.
type AnyProps = Record<string, unknown>;
type ControlProps = { children: ReactElement<AnyProps> };

const FFControl = ({ children }: ControlProps) => {
  const { id, descId, errId, invalid } = useFF();
  const injected: Partial<AnyProps> = {
    id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": descId,
    "aria-errormessage": invalid ? errId : undefined,
    "data-invalid": invalid ? "" : undefined,
  };
  return cloneElement(children, injected);
};
FormField.Control = FFControl;
