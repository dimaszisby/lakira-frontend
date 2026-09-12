"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cloneElement, createContext, useContext, useId } from "react";

import { cn } from "@/lib/cn";

import { ErrorMessage } from "./ErrorMessage";

type FormFieldContextValue = {
  id: string;
  describedBy?: string;
  errorId?: string;
  invalid: boolean;
};

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

const useFormFieldContext = () => {
  const value = useContext(FormFieldContext);
  if (!value) throw new Error("FormField.* must be used inside <FormField>");
  return value;
};

export type FormFieldProps = ComponentProps<"div"> & {
  id?: string;
  invalid?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
};

/**
 * Wires a label, a control, a description and a validation error together:
 * `FormField.Label` gets `htmlFor`, and `FormField.Control` injects the id,
 * `aria-invalid`, `aria-describedby` and `aria-errormessage` into its child.
 */
export const FormField = ({
  id: idProp,
  invalid,
  description,
  error,
  className,
  children,
  ...props
}: FormFieldProps) => {
  const fallbackId = useId();
  const id = idProp ?? `ff-${fallbackId}`;
  const descriptionId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-err` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const isInvalid = Boolean(invalid || error);

  return (
    <FormFieldContext.Provider value={{ id, describedBy, errorId, invalid: isInvalid }}>
      <div className={cn("flex flex-col gap-1.5", className)} {...props}>
        {children}

        {description ? (
          <p id={descriptionId} className="text-caption text-ink-secondary">
            {description}
          </p>
        ) : null}

        {error ? (
          <ErrorMessage
            id={errorId}
            message={error}
            size="sm"
            politeness="polite"
            reserveSpace={false}
          />
        ) : null}
      </div>
    </FormFieldContext.Provider>
  );
};

type FormFieldLabelProps = ComponentProps<"label">;

const FormFieldLabel = ({ className, ...props }: FormFieldLabelProps) => {
  const { id } = useFormFieldContext();
  return <label htmlFor={id} className={cn("text-input-label block", className)} {...props} />;
};

FormField.Label = FormFieldLabel;

type FormFieldControlProps = { children: ReactElement<Record<string, unknown>> };

const FormFieldControl = ({ children }: FormFieldControlProps) => {
  const { id, describedBy, errorId, invalid } = useFormFieldContext();
  const ownDescribedBy =
    typeof children.props["aria-describedby"] === "string"
      ? children.props["aria-describedby"]
      : undefined;

  return cloneElement(children, {
    id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": [ownDescribedBy, describedBy].filter(Boolean).join(" ") || undefined,
    "aria-errormessage": invalid ? errorId : undefined,
    "data-invalid": invalid ? "" : undefined,
  });
};

FormField.Control = FormFieldControl;
