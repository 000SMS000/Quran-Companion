import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { searchQuran } from "../api/quranApi";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTranslation } from "../hooks/useTranslation";

function SearchPage() {
  const { language } = usePreferences();
  const { t } = useTranslation();
  const activeLanguage = useRef(language);
  const activeLanguageRequest = useRef(0);
  activeLanguage.current = language;
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [requestNumber, setRequestNumber] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const visibleResults = results?.language === language ? results : null;
  const visibleError = error?.language === language ? error.message : "";
  const isLoading =
    loading || (Boolean(searched) && !visibleResults && !visibleError);

  function handleSubmit(event) {
    event.preventDefault();

    const value = query.trim();

    if (value.length < 2) {
      activeLanguageRequest.current += 1;
      setError({ language, message: t("search.invalidQuery") });
      setResults(null);
      setSearched("");
      setLoading(false);
      return;
    }

    setSearched(value);
    setResults(null);
    setError(null);
    setLoading(true);
    setRequestNumber((current) => current + 1);
  }

  useEffect(() => {
    if (!searched) {
      return undefined;
    }

    let cancelled = false;
    const requestId = ++activeLanguageRequest.current;
    const isCurrentRequest = () =>
      !cancelled &&
      activeLanguageRequest.current === requestId &&
      activeLanguage.current === language;

    setLoading(true);
    setError(null);
    setResults(null);

    searchQuran(searched, { language })
      .then((data) => {
        if (isCurrentRequest()) {
          setResults({ ...data, language });
        }
      })
      .catch((exception) => {
        if (isCurrentRequest()) {
          console.error("Could not search the Quran:", exception);
          setError({ language, message: t("search.requestError") });
        }
      })
      .finally(() => {
        if (isCurrentRequest()) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language, requestNumber, searched, t]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          {t("nav.search")}
        </p>
        <h1 className="mt-3 text-start text-4xl font-semibold text-slate-950 dark:text-white">
          {t("search.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-start text-slate-600 dark:text-slate-300">
          {t("search.description")}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <label className="relative flex-1">
          <span className="sr-only">{t("search.title")}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full rounded-md border border-slate-200 bg-white py-3 pe-4 ps-10 text-start text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("search.submit")}
        </button>
      </form>

      <section className="mt-8">
        {isLoading && <LoadingState label={t("search.searching")} />}

        {!isLoading && visibleError && (
          <ErrorState title={t("search.errorTitle")} message={visibleError} />
        )}

        {!isLoading && !visibleError && !visibleResults && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-start text-slate-500 dark:border-white/10 dark:text-slate-400">
            {t("search.emptyPrompt")}
          </div>
        )}

        {!isLoading &&
          !visibleError &&
          visibleResults &&
          visibleResults.matches.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-start text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t("search.noResults", { query: searched })}
            </div>
          )}

        {!isLoading &&
          !visibleError &&
          visibleResults?.matches.length > 0 && (
            <div>
              <p className="mb-4 text-start text-sm text-slate-500 dark:text-slate-400">
                {visibleResults.count === 1
                  ? t("search.resultsCountOne", { query: searched })
                  : t("search.resultsCountMany", {
                      count: visibleResults.count,
                      query: searched,
                    })}
              </p>

              <div className="space-y-4">
                {visibleResults.matches.map((match) => (
                  <article
                    key={`${match.number}-${match.numberInSurah}`}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-start">
                        <Link
                          to={`/surah/${match.surah?.number}?ayah=${match.numberInSurah}`}
                          className="font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100"
                        >
                          {language === "ar"
                            ? match.surah?.name
                            : match.surah?.englishName}{" "}
                          —{" "}
                          {t("search.ayah", {
                            number: match.numberInSurah,
                          })}
                        </Link>

                        {language === "en" && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {match.surah?.englishNameTranslation}
                          </p>
                        )}
                      </div>

                      {language === "en" && (
                        <p
                          className="quran-arabic text-xl text-slate-700 dark:text-slate-300"
                          dir="rtl"
                        >
                          {match.surah?.name}
                        </p>
                      )}
                    </div>

                    <p
                      className={`mt-4 leading-8 ${
                        language === "ar"
                          ? "quran-arabic text-end text-2xl text-slate-800 dark:text-slate-200"
                          : "text-start text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {match.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
      </section>
    </main>
  );
}

export default SearchPage;
