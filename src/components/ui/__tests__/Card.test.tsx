import { render, screen } from "@testing-library/react";

import Card, { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";

describe("Card", () => {
  it("renders with default recipe data attributes", () => {
    render(<Card data-testid="card-root">Content</Card>);

    const root = screen.getByTestId("card-root");

    expect(root).toHaveAttribute("data-size", "md");
    expect(root).toHaveAttribute("data-variant", "primary");
    expect(root).toHaveAttribute("data-radius", "md");
    expect(root).toHaveAttribute("data-elevation", "sm");
    expect(root).toHaveClass("card");
  });

  it("supports semantic root element and variant overrides", () => {
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

    expect(root.tagName.toLowerCase()).toBe("section");
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-variant", "secondary");
    expect(root).toHaveAttribute("data-radius", "lg");
    expect(root).toHaveAttribute("data-elevation", "none");
  });

  it("renders card subcomponents with expected structure", () => {
    render(
      <Card data-testid="card-root">
        <CardHeader data-testid="card-header">
          <CardTitle as="h3">Revenue</CardTitle>
          <CardDescription>Monthly summary</CardDescription>
        </CardHeader>
        <CardContent>42</CardContent>
        <CardFooter>Updated now</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId("card-header")).toHaveClass("card-header");
    expect(screen.getByRole("heading", { level: 3, name: /revenue/i })).toHaveClass("card-title");
    expect(screen.getByText(/monthly summary/i)).toHaveClass("card-description");
    expect(screen.getByText("42")).toHaveClass("card-content");
    expect(screen.getByText(/updated now/i)).toHaveClass("card-footer");
  });
});
