import { Settings } from "lucide-react";
import { AUDIO_EDITIONS } from "../contexts/PreferencesContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTranslation } from "../hooks/useTranslation";

function SettingsPage() {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    audioEdition,
    setAudioEdition,
  } = usePreferences();
  const { t } = useTranslation();

  function handleReciterChange(event) {
    const nextEdition = event.target.value;

    if (nextEdition === audioEdition) {
      return;
    }

    setAudioEdition(nextEdition);
    window.location.reload();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
          <Settings size={23} />
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("settings.description")}
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-6">
        <section className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t("settings.language")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("settings.languageDescription")}
          </p>
          <label className="mt-4 block">
            <span className="sr-only">{t("settings.language")}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="ar">{t("settings.arabic")}</option>
              <option value="en">{t("settings.english")}</option>
            </select>
          </label>
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
          >
            {t("settings.currentLanguage")}:{" "}
            <span className="font-semibold">
              {language === "ar"
                ? t("settings.arabic")
                : t("settings.english")}
            </span>
          </p>
        </section>

        <section className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t("settings.appearance")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("settings.appearanceDescription")}
          </p>
          <label className="mt-4 block">
            <span className="sr-only">{t("settings.appearance")}</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="light">{t("settings.light")}</option>
              <option value="dark">{t("settings.dark")}</option>
            </select>
          </label>
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
          >
            {t("settings.currentTheme")}:{" "}
            <span className="font-semibold">
              {theme === "light"
                ? t("settings.light")
                : t("settings.dark")}
            </span>
          </p>
        </section>

        <section className="rounded-xl border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t("settings.audio")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("settings.audioDescription")}
          </p>
          <label className="mt-4 block">
            <span className="sr-only">{t("settings.audio")}</span>
            <select
              value={audioEdition}
              onChange={handleReciterChange}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              {AUDIO_EDITIONS.map((edition) => (
                <option key={edition.id} value={edition.id}>
                  {language === "ar" ? edition.nameAr : edition.nameEn} · {edition.bitrate}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100">
            {language === "ar" ? "يُحفظ اختيار القارئ تلقائيًا على هذا الجهاز." : "Your reciter choice is saved automatically on this device."}
          </p>
        </section>
      </div>
    </main>
  );
}

export default SettingsPage;
