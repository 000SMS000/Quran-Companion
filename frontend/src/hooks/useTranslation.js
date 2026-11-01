import { useCallback } from "react";
import { usePreferences } from "../contexts/PreferencesContext";
import arabic from "../locales/ar/common";
import english from "../locales/en/common";

const translations = {
  ar: arabic,
  en: english,
};

export function useTranslation() {
  const { language } = usePreferences();

  const t = useCallback(
    (key, values = {}) => {
      const value = key
        .split(".")
        .reduce((current, part) => current?.[part], translations[language]);

      if (typeof value !== "string") {
        return key;
      }

      return value.replace(/\{\{(\w+)\}\}/g, (placeholder, name) =>
        Object.hasOwn(values, name) ? String(values[name]) : placeholder,
      );
    },
    [language],
  );

  return { t };
}
