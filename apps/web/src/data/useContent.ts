import { useLanguage } from "../i18n/LanguageContext";
import { uiText } from "../i18n/ui";
import * as en from "./content.en";
import * as tr from "./content.tr";

const content = { en, tr };

export function useContent() {
  const { lang } = useLanguage();
  return { ...content[lang], ui: uiText[lang], lang };
}
