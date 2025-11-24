import React from "react";

import { cn } from "@/src/lib/cn";

export type CardSize = "xs" | "sm" | "md" | "lg";
export type CardVariant = "primary" | "secondary" | "ghost" | "outlined";
export type CardRadius = "sm" | "md" | "lg";
export type CardElevation = "none" | "sm" | "md";

/**
 * Reusable Primitive: Card
 *
 * A versatile surface primitive for Lakira:
 * - size: padding/gap density ("xs" | "sm" | "md" | "lg")
 * - variant: visual tone ("primary" | "secondary" | "ghost" | "outlined")
 * - radius: corner rounding ("sm" | "md" | "lg")
 * - elevation: shadow depth ("none" | "sm" | "md")
 *
 * Usage:
 * ```tsx
 * <Card size="lg" variant="secondary" className="custom-class">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>This is a description.</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Main content goes here.
 *   </CardContent>
 *   <CardFooter>
 *     Footer content here.
 *   </CardFooter>
 * </Card>
 * ```
 */

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: CardSize;
  variant?: CardVariant;
  radius?: CardRadius;
  elevation?: CardElevation;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { size = "md", variant = "primary", radius = "md", elevation = "sm", className, ...rest },
    ref,
  ) => {
    return (
      <div
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

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...rest }, ref) => {
    return <h2 ref={ref} className={cn("card-title", className)} {...rest} />;
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
