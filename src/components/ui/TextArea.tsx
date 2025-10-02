import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import FieldShell from "./FieldShell";

type Props = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string; // wrapper class
  textareaClassName?: string; // textarea element class
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
};

const TextAreaField = ({
  id,
  label,
  registration,
  rows = 4,
  placeholder,
  disabled,
  required,
  hint,
  error,
  className,
  textareaClassName,
  onChange,
}: Props) => {
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <textarea
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={["input-textfield", textareaClassName].filter(Boolean).join(" ")}
        {...registration}
        onChange={(e) => {
          void registration.onChange(e);
          onChange?.(e);
        }}
      />
    </FieldShell>
  );
};

export default TextAreaField;
