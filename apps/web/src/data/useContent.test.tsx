import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage } from "../i18n/LanguageContext";
import { uiText } from "../i18n/ui";
import { useContent } from "./useContent";
import * as en from "./content.en";
import * as tr from "./content.tr";

function Probe() {
  const { profile, ui, lang } = useContent();
  const { setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="name">{profile.name}</span>
      <span data-testid="resume-button">{ui.hero.resumeButton}</span>
      <button onClick={() => setLang("tr")}>switch-to-tr</button>
    </div>
  );
}

describe("useContent", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("combines the English content data with the English ui text by default", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("name")).toHaveTextContent(en.profile.name);
    expect(screen.getByTestId("resume-button")).toHaveTextContent(uiText.en.hero.resumeButton);
  });

  it("switches to the Turkish content data and ui text together when the language changes", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    await user.click(screen.getByText("switch-to-tr"));

    expect(screen.getByTestId("lang")).toHaveTextContent("tr");
    expect(screen.getByTestId("name")).toHaveTextContent(tr.profile.name);
    expect(screen.getByTestId("resume-button")).toHaveTextContent(uiText.tr.hero.resumeButton);
  });
});
