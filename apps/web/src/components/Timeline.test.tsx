import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline, TimelineItem } from "./Timeline";

describe("Timeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders each TimelineItem's children in order", () => {
    render(
      <Timeline>
        <TimelineItem>
          <p>First item</p>
        </TimelineItem>
        <TimelineItem>
          <p>Second item</p>
        </TimelineItem>
      </Timeline>,
    );

    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
  });

  it("throws when a TimelineItem is rendered outside a Timeline", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(
        <TimelineItem>
          <p>Orphan</p>
        </TimelineItem>,
      ),
    ).toThrow("TimelineItem must be used within a Timeline");
  });
});
