// Server entry used only at build time by scripts/prerender.mjs: renders the public pages to
// static HTML so crawlers and link-preview bots that don't run JavaScript still get the full
// resume. The browser entry (main.tsx) then renders over it with createRoot.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./theme/ThemeContext";

export function render(url: string) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <LanguageProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LanguageProvider>
      </StaticRouter>
    </StrictMode>,
  );
}

export { buildHead, buildLlmsFullTxt, buildLlmsTxt, buildSitemap, pageFacts, pagePath } from "./seo/site";
