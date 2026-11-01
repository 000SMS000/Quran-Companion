import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const PreferencesContext = createContext(null);

const LANGUAGE_STORAGE_KEY = "quran_companion_language";
const THEME_STORAGE_KEY = "quran_companion_theme";
const AUDIO_EDITION_STORAGE_KEY = "quran_companion_audio_edition";

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Could not read preference "${key}" from localStorage:`, error);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Could not save preference "${key}" to localStorage:`, error);
  }
}

function getStoredValue(key, fallback, allowedValues) {
  const value = readStorage(key);

  return allowedValues.includes(value) ? value : fallback;
}

function getInitialTheme() {
  const storedTheme = readStorage(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  const legacyTheme = readStorage("theme");

  return legacyTheme === "dark" ? "dark" : "light";
}

export function PreferencesProvider({ children }) {
  const [language, setLanguageState] = useState(() =>
    getStoredValue(LANGUAGE_STORAGE_KEY, "en", ["ar", "en"]),
  );
  const [theme, setThemeState] = useState(getInitialTheme);
  const [audioEdition, setAudioEditionState] = useState(
    () => readStorage(AUDIO_EDITION_STORAGE_KEY) || "ar.alafasy",
  );

  const setLanguage = useCallback((value) => {
    if (value === "ar" || value === "en") {
      setLanguageState(value);
    }
  }, []);

  const setTheme = useCallback((value) => {
    if (value === "light" || value === "dark") {
      setThemeState(value);
    }
  }, []);

  const setAudioEdition = useCallback((value) => {
    if (typeof value === "string" && value.trim() !== "") {
      setAudioEditionState(value);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    writeStorage(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    writeStorage(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    writeStorage(AUDIO_EDITION_STORAGE_KEY, audioEdition);
  }, [audioEdition]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      audioEdition,
      setAudioEdition,
    }),
    [
      language,
      setLanguage,
      theme,
      setTheme,
      audioEdition,
      setAudioEdition,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }

  return context;
}
