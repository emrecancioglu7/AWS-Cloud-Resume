import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import { profile } from "../data/content.en";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders the name and social/resume links", () => {
    renderWithProviders(<Hero />);

    expect(screen.getByRole("heading", { name: profile.name })).toBeInTheDocument();
    expect(screen.getByLabelText("LinkedIn")).toHaveAttribute("href", profile.social.linkedin);
    expect(screen.getByLabelText("GitHub")).toHaveAttribute("href", profile.social.github);
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });
});
