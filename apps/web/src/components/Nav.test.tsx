import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/test-utils";
import { uiText } from "../i18n/ui";
import { Nav } from "./Nav";

describe("Nav", () => {
  it("renders all nav links", () => {
    renderWithProviders(<Nav />);

    for (const link of uiText.en.nav.links) {
      expect(screen.getByText(link.label)).toBeInTheDocument();
    }
  });

  it("toggles the theme label when the theme button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Nav />);

    const toggle = screen.getByText(/Mode$/);
    const initialText = toggle.textContent;

    await user.click(toggle);

    expect(screen.getByText(/Mode$/).textContent).not.toBe(initialText);
  });
});
