import React from "react";

interface PrimaryButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  type?: "submit" | "reset" | "button" | undefined;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onClick,
  children,
  type,
  ariaLabel,
  className,
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl bg-[#A8C28B] px-6 py-2 font-semibold text-white transition hover:bg-[#7C9B63] ${
        disabled
          ? "cursor-not-allowed bg-gray-400 opacity-50 hover:bg-gray-400"
          : "hover:bg-blue-700"
      } ${className}`}
      type={type}
      aria-label={ariaLabel}
      role="button"
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
