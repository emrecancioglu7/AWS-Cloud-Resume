import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage } from "./LanguageContext";

function Consumer() {
  const { lang, toggleLang, setLang } = useLanguage();
  return (
    <div>
      <span>{lang}</span>
      <button onClick={toggleLang}>toggle</button>
      <button onClick={() => setLang("tr")}>set-tr</button>
    </div>
  );
}

describe("LanguageContext", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to English when nothing is stored and the browser isn't Turkish", () => {
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>,
    );

    expect(screen.getByText("en")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("reads a previously stored language ahead of navigator.language", () => {
    window.localStorage.setItem("lang", "tr");

    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>,
    );

    expect(screen.getByText("tr")).toBeInTheDocument();
  });

  it("toggles the language, updates <html lang>, and persists the choice", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>,
    );

    await user.click(screen.getByText("toggle"));

    expect(screen.getByText("tr")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("tr");
    expect(window.localStorage.getItem("lang")).toBe("tr");
  });

  it("setLang assigns an explicit language", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>,
    );

    await user.click(screen.getByText("set-tr"));

    expect(screen.getByText("tr")).toBeInTheDocument();
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
