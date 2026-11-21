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
export const AUDIO_EDITIONS = [
  {
    "id": "everyayah.minshawy.murattal.128",
    "folder": "Minshawy_Murattal_128kbps",
    "nameAr": "محمد صديق المنشاوي — مرتل",
    "nameEn": "Mohamed Siddiq Al-Minshawy — Murattal",
    "bitrate": "128kbps"
  },
  {
    "id": "everyayah.alafasy.128",
    "folder": "Alafasy_128kbps",
    "nameAr": "مشاري العفاسي — مرتل",
    "nameEn": "Mishary Rashid Alafasy — Murattal",
    "bitrate": "128kbps"
  },
  {
    "id": "everyayah.husary.128",
    "folder": "Husary_128kbps",
    "nameAr": "محمود خليل الحصري — مرتل",
    "nameEn": "Mahmoud Khalil Al-Husary — Murattal",
    "bitrate": "128kbps"
  },
  {
    "id": "everyayah.hudhaify.128",
    "folder": "Hudhaify_128kbps",
    "nameAr": "علي الحذيفي — مرتل",
    "nameEn": "Ali Al-Hudhaify — Murattal",
    "bitrate": "128kbps"
  },
  {
    "id": "everyayah.maher.128",
    "folder": "MaherAlMuaiqly128kbps",
    "nameAr": "ماهر المعيقلي — مرتل",
    "nameEn": "Maher Al-Muaiqly — Murattal",
    "bitrate": "128kbps"
  },
  {
    "id": "everyayah.sudais.192",
    "folder": "Abdurrahmaan_As-Sudais_192kbps",
    "nameAr": "عبدالرحمن السديس — مرتل",
    "nameEn": "Abdurrahmaan As-Sudais — Murattal",
    "bitrate": "192kbps"
  },
  {
    "id": "everyayah.shuraim.128",
    "folder": "Saood_ash-Shuraym_128kbps",
    "nameAr": "سعود الشريم — مرتل",
    "nameEn": "Saood Ash-Shuraym — Murattal",
    "bitrate": "128kbps"
  },
  {
    "id": "everyayah.yasser.128",
    "folder": "Yasser_Ad-Dussary_128kbps",
    "nameAr": "ياسر الدوسري — مرتل",
    "nameEn": "Yasser Ad-Dussary — Murattal",
    "bitrate": "128kbps"
  },
  {
    "id": "everyayah.nasser.128",
    "folder": "Nasser_Alqatami_128kbps",
    "nameAr": "ناصر القطامي — مرتل",
    "nameEn": "Nasser Al-Qatami — Murattal",
    "bitrate": "128kbps"
  }
];
export const DEFAULT_AUDIO_EDITION = AUDIO_EDITIONS[0].id;

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
  const [audioEdition, setAudioEditionState] = useState(() =>
    getStoredValue(
      AUDIO_EDITION_STORAGE_KEY,
      DEFAULT_AUDIO_EDITION,
      AUDIO_EDITIONS.map((edition) => edition.id),
    ),
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
    if (AUDIO_EDITIONS.some((edition) => edition.id === value)) {
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
