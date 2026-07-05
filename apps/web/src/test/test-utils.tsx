import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../theme/ThemeContext";
import { LanguageProvider } from "../i18n/LanguageContext";
import { AuthProvider } from "../auth/AuthContext";

export function renderWithProviders(ui: ReactElement, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>{ui}</AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}
