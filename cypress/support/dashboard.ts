// What the stack specs read off a dashboard card.

const COUNT = /^n: \d+$/;

/**
 * The count on a metric's dashboard card: `n: 2` means two logged values. Matched on its own
 * element, because the card's text runs together ("max: 4200n: 1") and "min: 4200" holds "n: 4".
 */
export const cardCount = (metricName: string) =>
  cy
    .contains(metricName)
    .parents()
    .filter((_index, element) =>
      Array.from(element.querySelectorAll("span")).some((span) =>
        COUNT.test(span.textContent ?? ""),
      ),
    )
    .first()
    .contains("span", COUNT);
