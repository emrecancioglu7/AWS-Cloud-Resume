import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test/test-utils";
import { profile } from "./data/content.en";
import App from "./App";

describe("App", () => {
  it("redirects unknown routes back to home", () => {
    renderWithProviders(<App />, { route: "/some/unknown/path" });

    expect(screen.getByRole("heading", { name: profile.name, level: 1 })).toBeInTheDocument();
  });
});
