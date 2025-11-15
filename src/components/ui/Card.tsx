import React from "react";

import { cn } from "@/src/lib/cn";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary";

/**
 * Reusable Primitive: Card
 *
 * A versatile Card component with customizable size and variant options.
 *
 * Props:
 * - size: Determines the size of the card. Options are "sm", "md", "lg". Default is "md".
 * - variant: Determines the visual style of the card. Options are "primary", "secondary". Default is "primary".
 * - className: Additional CSS classes to apply to the card.
 * - children: The content of the card.
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
  size?: Size;
  variant?: Variant;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ size = "md", variant = "primary", className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("card", className)}
        data-size={size}
        data-variant={variant}
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
