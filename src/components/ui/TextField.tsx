import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import FieldShell from "./FieldShell";

type Props = {
  id: string; // stable id for a11y
  label: string;
  registration: UseFormRegisterReturn;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const TextField = ({
  id,
  label,
  registration,
  type = "text",
  placeholder,
  disabled,
  required,
  hint,
  error,
  className,
  inputClassName,
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
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={["input-textfield", inputClassName].filter(Boolean).join(" ")}
        {...registration}
        onChange={(e) => {
          // keep RHF in the loop, then your side-effect
          void registration.onChange(e);
          onChange?.(e);
        }}
      />
    </FieldShell>
  );
};

export default TextField;
