import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Consumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={() => toggleTheme()}>
      {theme}
    </button>
  );
}

describe("ThemeContext", () => {
  it("toggles the theme and reflects it on <html>", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");
    const initial = button.textContent;

    await user.click(button);

    expect(button.textContent).not.toBe(initial);
    expect(document.documentElement.classList.contains("light")).toBe(button.textContent === "light");
  });
});
