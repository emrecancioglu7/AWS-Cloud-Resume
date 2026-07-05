import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedMetrics } from "./AnimatedMetrics";

// Forces the count-up to display its target value immediately instead of animating over
// rAF frames, so assertions don't need to wait on timing.
function mockReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion") ? matches : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
}

describe("AnimatedMetrics", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockReducedMotion(true);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders plain text with no metrics unchanged", () => {
    render(<AnimatedMetrics text="No numbers here" />);
    expect(screen.getByText("No numbers here")).toBeInTheDocument();
  });

  it("highlights an English-style suffix percentage", () => {
    render(<AnimatedMetrics text="Increased efficiency by 19%" />);
    expect(screen.getByText("Increased efficiency by")).toBeInTheDocument();
    expect(screen.getByText("19%")).toBeInTheDocument();
  });

  it("highlights a Turkish-style prefix percentage", () => {
    render(<AnimatedMetrics text="Verimliliği %19 artırdı" />);
    expect(screen.getByText("%19")).toBeInTheDocument();
  });

  it("highlights multiple distinct metric shapes within the same string", () => {
    render(<AnimatedMetrics text="Cut costs by $200K and grew revenue 3x" />);
    expect(screen.getByText("$200K")).toBeInTheDocument();
    expect(screen.getByText("3x")).toBeInTheDocument();
  });
});
