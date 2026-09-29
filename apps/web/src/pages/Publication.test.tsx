import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../test/test-utils";
import App from "../App";
import { publicationList, publicationPath, publicationsBySlug } from "../data/publications";
import { profile } from "../data/content.en";
import { uiText } from "../i18n/ui";

vi.mock("../lib/visitorCounter", () => ({ fetchVisitorCount: () => Promise.resolve(1) }));

describe("Publication page", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows the published title, English title, authors, DOI and the official link", () => {
    const p = publicationsBySlug.get("fault-detection-poincare-ensemble-2021")!;
    renderWithProviders(<App />, { route: publicationPath(p.slug) });

    expect(screen.getByRole("heading", { level: 1, name: p.title })).toBeInTheDocument();
    expect(screen.getByText(p.titleEn!)).toBeInTheDocument();
    // Scoped to the authors row — the nav and footer also show the site owner's name.
    const authorsRow = screen.getByText(uiText.en.publication.authors).nextElementSibling as HTMLElement;
    for (const a of p.authors) expect(within(authorsRow).getByText(a.name)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: p.doi! })).toHaveAttribute("href", `https://doi.org/${p.doi}`);
    expect(screen.getByRole("link", { name: new RegExp(uiText.en.publication.readPaper) })).toHaveAttribute("href", p.url);
  });

  it("says there's no online copy when a paper has no link", () => {
    renderWithProviders(<App />, { route: publicationPath("ecg-fpga-digital-filter-design-2020") });

    expect(screen.getByText(uiText.en.publication.noOnlineCopy)).toBeInTheDocument();
  });

  it("puts the Turkish abstract first for a visitor who chose Turkish", () => {
    window.localStorage.setItem("lang", "tr");
    renderWithProviders(<App />, { route: publicationPath("lstm-heart-sound-classification-2020") });

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.indexOf(uiText.tr.publication.abstractTr)).toBeLessThan(headings.indexOf(uiText.tr.publication.abstractEn));
  });

  it("sends an unknown slug back to the home page", () => {
    renderWithProviders(<App />, { route: "/publications/does-not-exist" });

    expect(screen.getByRole("heading", { level: 1, name: profile.name })).toBeInTheDocument();
  });

  it("has a page for every publication", () => {
    for (const p of publicationList) expect(publicationsBySlug.get(p.slug)).toBe(p);
  });
});
