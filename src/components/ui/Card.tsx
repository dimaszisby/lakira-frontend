import type { ElementType, HTMLAttributes } from "react";
import React from "react";

import { cn } from "@/lib/cn";

export type CardSize = "xs" | "sm" | "md" | "lg";
export type CardVariant = "primary" | "secondary" | "ghost" | "outlined";
export type CardRadius = "none" | "sm" | "md" | "lg";
export type CardElevation = "none" | "sm" | "md";

type CardElement = "article" | "section" | "aside" | "div";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  size?: CardSize;
  variant?: CardVariant;
  radius?: CardRadius;
  elevation?: CardElevation;
};

const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      as = "div",
      size = "md",
      variant = "primary",
      radius = "md",
      elevation = "sm",
      className,
      ...rest
    },
    ref,
  ) => {
    const Component = as as ElementType;
    return (
      <Component
        ref={ref}
        className={cn("card", className)}
        data-size={size}
        data-variant={variant}
        data-radius={radius}
        data-elevation={elevation}
        {...rest}
      />
    );
  },
);

Card.displayName = "Card";

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...rest }, ref) => {
    return <div ref={ref} className={cn("card-header", className)} {...rest} />;
  },
);

CardHeader.displayName = "CardHeader";

type CardTitleElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: CardTitleElement;
};

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as = "h2", className, ...rest }, ref) => {
    const Component = as as ElementType;
    return <Component ref={ref} className={cn("card-title", className)} {...rest} />;
  },
);

CardTitle.displayName = "CardTitle";

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...rest }, ref) => {
    return <p ref={ref} className={cn("card-description", className)} {...rest} />;
  },
);

CardDescription.displayName = "CardDescription";

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...rest }, ref) => {
    return <div ref={ref} className={cn("card-content", className)} {...rest} />;
  },
);

CardContent.displayName = "CardContent";

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...rest }, ref) => {
    return <div ref={ref} className={cn("card-footer", className)} {...rest} />;
  },
);

CardFooter.displayName = "CardFooter";

export default Card;
