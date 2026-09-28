import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedMetrics, CountUpMetric } from "./AnimatedMetrics";

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

  it("keeps the source's decimal places instead of rounding", () => {
    render(<AnimatedMetrics text="Reached 25.76% coverage" />);
    expect(screen.getByText("25.76%")).toBeInTheDocument();
  });

  it("handles Turkish comma decimals and a trailing comma as punctuation", () => {
    render(<AnimatedMetrics text="kapsamı %25,76 oldu, verimliliği %19, güvenilirliği %14 artırdı" />);
    expect(screen.getByText("%25,76")).toBeInTheDocument();
    expect(screen.getByText("%19")).toBeInTheDocument();
    expect(screen.getByText("%14")).toBeInTheDocument();
  });

  it("counts up plain and plus-suffixed numbers via CountUpMetric", () => {
    render(
      <>
        <CountUpMetric value="9+" />
        <CountUpMetric value="3" />
      </>,
    );
    expect(screen.getByText("9+")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
