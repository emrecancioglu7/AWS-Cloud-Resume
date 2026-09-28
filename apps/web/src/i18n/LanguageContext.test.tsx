import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { LanguageProvider, langPath, useLanguage } from "./LanguageContext";

function Consumer() {
  const { lang, toggleLang, setLang } = useLanguage();
  const { pathname } = useLocation();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="path">{pathname}</span>
      <button onClick={toggleLang}>toggle</button>
      <button onClick={() => setLang("tr")}>set-tr</button>
    </div>
  );
}

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("LanguageContext", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("serves English at / and sets <html lang>", () => {
    renderAt("/");

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("serves Turkish at /tr", () => {
    renderAt("/tr");

    expect(screen.getByTestId("lang")).toHaveTextContent("tr");
    expect(document.documentElement.lang).toBe("tr");
  });

  it("lets the URL win over a stored preference on the public pages", () => {
    window.localStorage.setItem("lang", "tr");
    renderAt("/");

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
  });

  it("falls back to the stored preference on routes without a language in the URL", () => {
    window.localStorage.setItem("lang", "tr");
    renderAt("/admin");

    expect(screen.getByTestId("lang")).toHaveTextContent("tr");
  });

  it("toggling navigates between / and /tr and persists the explicit choice", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("lang")).toHaveTextContent("tr");
    expect(screen.getByTestId("path")).toHaveTextContent("/tr");
    expect(window.localStorage.getItem("lang")).toBe("tr");

    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("path")).toHaveTextContent(/^\/$/);
    expect(window.localStorage.getItem("lang")).toBe("en");
  });

  it("does not write a preference just from visiting a page", () => {
    renderAt("/tr");

    expect(window.localStorage.getItem("lang")).toBeNull();
  });

  it("changes the language without navigating away from a non-language route", async () => {
    const user = userEvent.setup();
    renderAt("/admin");

    await user.click(screen.getByText("set-tr"));

    expect(screen.getByTestId("lang")).toHaveTextContent("tr");
    expect(screen.getByTestId("path")).toHaveTextContent("/admin");
  });

  it("maps each language to its public path", () => {
    expect(langPath("en")).toBe("/");
    expect(langPath("tr")).toBe("/tr");
  });

  it("throws when used outside a LanguageProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    function Bare() {
      useLanguage();
      return null;
    }

    expect(() => render(<Bare />)).toThrow("useLanguage must be used within LanguageProvider");
    vi.restoreAllMocks();
  });
});
