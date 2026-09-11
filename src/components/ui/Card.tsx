import type { ComponentProps, ElementType, HTMLAttributes, Ref } from "react";

import { cn } from "@/lib/cn";

export type CardSize = "xs" | "sm" | "md" | "lg";
export type CardVariant = "primary" | "secondary" | "ghost" | "outlined";
export type CardRadius = "none" | "sm" | "md" | "lg";
export type CardElevation = "none" | "sm" | "md";

type CardElement = "article" | "section" | "aside" | "div";

export type CardProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  as?: CardElement;
  size?: CardSize;
  variant?: CardVariant;
  radius?: CardRadius;
  elevation?: CardElevation;
};

export const Card = ({
  as = "div",
  size = "md",
  variant = "primary",
  radius = "md",
  elevation = "sm",
  className,
  ...props
}: CardProps) => {
  const Component = as as ElementType;

  return (
    <Component
      className={cn("card", className)}
      data-size={size}
      data-variant={variant}
      data-radius={radius}
      data-elevation={elevation}
      {...props}
    />
  );
};

export type CardHeaderProps = ComponentProps<"div">;

export const CardHeader = ({ className, ...props }: CardHeaderProps) => (
  <div className={cn("card-header", className)} {...props} />
);

type CardTitleElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type CardTitleProps = ComponentProps<"h2"> & {
  as?: CardTitleElement;
};

export const CardTitle = ({ as = "h2", className, ...props }: CardTitleProps) => {
  const Component = as as ElementType;

  return <Component className={cn("card-title", className)} {...props} />;
};

export type CardDescriptionProps = ComponentProps<"p">;

export const CardDescription = ({ className, ...props }: CardDescriptionProps) => (
  <p className={cn("card-description", className)} {...props} />
);

export type CardContentProps = ComponentProps<"div">;

export const CardContent = ({ className, ...props }: CardContentProps) => (
  <div className={cn("card-content", className)} {...props} />
);

export type CardFooterProps = ComponentProps<"div">;

export const CardFooter = ({ className, ...props }: CardFooterProps) => (
  <div className={cn("card-footer", className)} {...props} />
);
