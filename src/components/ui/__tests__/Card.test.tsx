import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

describe("Card", () => {
  it("exposes default size, variant, radius and elevation to the recipe", () => {
    render(<Card data-testid="card-root">Content</Card>);

    const root = screen.getByTestId("card-root");
    expect(root).toHaveAttribute("data-size", "md");
    expect(root).toHaveAttribute("data-variant", "primary");
    expect(root).toHaveAttribute("data-radius", "md");
    expect(root).toHaveAttribute("data-elevation", "sm");
  });

  it("renders the requested semantic element with overrides", () => {
    render(
      <Card
        as="section"
        size="lg"
        variant="secondary"
        radius="lg"
        elevation="none"
        aria-label="Metrics overview"
      >
        Section content
      </Card>,
    );

    const root = screen.getByRole("region", { name: /metrics overview/i });
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-variant", "secondary");
    expect(root).toHaveAttribute("data-radius", "lg");
    expect(root).toHaveAttribute("data-elevation", "none");
  });

  it("forwards ref as a prop to the root element", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card as="article" ref={ref}>
        Content
      </Card>,
    );

    expect(ref.current?.tagName).toBe("ARTICLE");
  });

  it("renders subcomponents with a configurable title heading level", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle as="h3">Revenue</CardTitle>
          <CardDescription>Monthly summary</CardDescription>
        </CardHeader>
        <CardContent>42</CardContent>
        <CardFooter>Updated now</CardFooter>
      </Card>,
    );

    expect(screen.getByRole("heading", { level: 3, name: /revenue/i })).toBeInTheDocument();
    expect(screen.getByText(/monthly summary/i)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/updated now/i)).toBeInTheDocument();
  });
});
