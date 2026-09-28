import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test/test-utils";
import { profile } from "./data/content.en";
import * as tr from "./data/content.tr";
import { uiText } from "./i18n/ui";
import App from "./App";

describe("App", () => {
  it("redirects unknown routes back to home", () => {
    renderWithProviders(<App />, { route: "/some/unknown/path" });

    expect(screen.getByRole("heading", { name: profile.name, level: 1 })).toBeInTheDocument();
  });

  it("renders the Turkish page at /tr, with the Turkish resume PDF", () => {
    renderWithProviders(<App />, { route: "/tr" });

    expect(document.documentElement.lang).toBe("tr");
    const resumeLinks = screen.getAllByRole("link", { name: uiText.tr.hero.resumeButton }).map((a) => a.getAttribute("href"));
    // The nav's in-page "#resume" link shares the label — and staying an in-page anchor proves Nav treats /tr as home.
    expect(resumeLinks).toEqual(expect.arrayContaining(["#resume", tr.profile.resumePdfUrl]));
  });
});
