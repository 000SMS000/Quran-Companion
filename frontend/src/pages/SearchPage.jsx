import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchQuran } from '../api/quranApi';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [language, setLanguage] = useState('en');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isArabic = language === 'ar';

  async function handleSubmit(event) {
    event.preventDefault();

    const value = query.trim();

    if (value.length < 2) {
      setError(
        isArabic
          ? 'يرجى إدخال حرفين على الأقل للبحث.'
          : 'Please enter at least 2 characters.',
      );
      setResults(null);
      return;
    }

    setLoading(true);
    setError('');
    setSearched(value);

    try {
      setResults(
        await searchQuran(value, {
          language,
        }),
      );
    } catch (exception) {
      setResults(null);
      setError(exception.response?.data?.message ?? exception.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageChange(nextLanguage) {
    setLanguage(nextLanguage);
    setResults(null);
    setError('');
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div dir={isArabic ? 'rtl' : 'ltr'}>
        <p
          className={`text-sm font-medium uppercase tracking-[0.16em] ${
            isArabic
              ? 'text-right text-emerald-700 dark:text-emerald-300'
              : 'text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isArabic ? 'البحث' : 'Search'}
        </p>

        <h1
          className={`mt-3 text-4xl font-semibold text-slate-950 dark:text-white ${
            isArabic ? 'text-right' : ''
          }`}
        >
          {isArabic ? 'البحث في القرآن الكريم' : 'Search Quran translations'}
        </h1>

        <p
          className={`mt-3 max-w-2xl text-slate-600 dark:text-slate-300 ${
            isArabic ? 'text-right' : ''
          }`}
        >
          {isArabic
            ? 'ابحث مباشرة في نص القرآن الكريم.'
            : 'Search Quran translations using English keywords.'}
        </p>
      </div>

      <div className="mt-8 flex gap-2 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
        <button
          type="button"
          onClick={() => handleLanguageChange('ar')}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            isArabic
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-300'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          العربية
        </button>

        <button
          type="button"
          onClick={() => handleLanguageChange('en')}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            !isArabic
              ? 'bg-white text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-300'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          English
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`mt-4 flex flex-col gap-3 sm:flex-row ${
          isArabic ? 'sm:flex-row-reverse' : ''
        }`}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <label className="relative flex-1">
          <Search
            className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ${
              isArabic ? 'right-3' : 'left-3'
            }`}
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            dir={isArabic ? 'rtl' : 'ltr'}
            placeholder={
              isArabic
                ? 'ابحث مثل: الله، الرحمة، الصلاة...'
                : 'Search for patience, mercy, prayer...'
            }
            className={`w-full rounded-md border border-slate-200 bg-white py-3 ${
              isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4'
            } text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-white/5 dark:text-white`}
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-emerald-800"
        >
          {isArabic ? 'بحث' : 'Search'}
        </button>
      </form>

      <section className="mt-8">
        {loading && (
          <LoadingState
            label={isArabic ? 'جاري البحث في القرآن...' : 'Searching Quran...'}
          />
        )}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && !results && (
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="rounded-lg border border-dashed border-slate-300 p-8 text-slate-500 dark:border-white/10 dark:text-slate-400"
          >
            {isArabic
              ? 'أدخل كلمة للبدء بالبحث.'
              : 'Enter a search term to begin.'}
          </div>
        )}

        {!loading && !error && results && results.matches.length === 0 && (
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="rounded-lg border border-dashed border-slate-300 p-8 text-slate-500 dark:border-white/10 dark:text-slate-400"
          >
            {isArabic
              ? `لم يتم العثور على نتائج لـ "${searched}".`
              : `No results found for "${searched}".`}
          </div>
        )}

        {!loading && !error && results?.matches.length > 0 && (
          <div dir={isArabic ? 'rtl' : 'ltr'}>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {isArabic
                ? `${results.count} نتيجة لـ "${searched}"`
                : `${results.count} matches for "${searched}"`}
            </p>

            <div className="space-y-4">
              {results.matches.map((match) => (
                <article
                  key={`${match.number}-${match.numberInSurah}`}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className={isArabic ? 'text-right' : ''}>
                      <Link
                        to={`/surah/${match.surah?.number}?ayah=${match.numberInSurah}`}
                        className="font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100"
                      >
                        {match.surah?.englishName} ·{' '}
                        {isArabic
                          ? `الآية ${match.numberInSurah}`
                          : `Ayah ${match.numberInSurah}`}
                      </Link>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {match.surah?.englishNameTranslation}
                      </p>
                    </div>

                    <p
                      className="quran-arabic text-xl text-slate-700 dark:text-slate-300"
                      dir="rtl"
                    >
                      {match.surah?.name}
                    </p>
                  </div>

                  <p
                    dir={isArabic ? 'rtl' : 'ltr'}
                    className={`mt-4 leading-8 ${
                      isArabic
                        ? 'quran-arabic text-right text-2xl text-slate-800 dark:text-slate-200'
                        : 'text-slate-700 dark:text-slate-300'
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