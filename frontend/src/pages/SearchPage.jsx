import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchQuran } from '../api/quranApi';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const value = query.trim();

    if (value.length < 2) {
      setError('Please enter at least 2 characters.');
      setResults(null);
      return;
    }

    setLoading(true);
    setError('');
    setSearched(value);

    try {
      setResults(await searchQuran(value));
    } catch (exception) {
      setResults(null);
      setError(exception.response?.data?.message ?? exception.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          Search
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
          Search Quran translations
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Search requests go from React to Laravel, then to Al Quran Cloud.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for patience, mercy, prayer..."
            className="w-full rounded-md border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-emerald-800"
        >
          Search
        </button>
      </form>

      <section className="mt-8">
        {loading && <LoadingState label="Searching Quran..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && !results && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-slate-500 dark:border-white/10 dark:text-slate-400">
            Enter a search term to begin.
          </div>
        )}
        {!loading && !error && results && results.matches.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-slate-500 dark:border-white/10 dark:text-slate-400">
            No results found for "{searched}".
          </div>
        )}
        {!loading && !error && results?.matches.length > 0 && (
          <div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {results.count} matches for "{searched}"
            </p>
            <div className="space-y-4">
              {results.matches.map((match) => (
                <article
                  key={`${match.number}-${match.numberInSurah}`}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        to={`/surah/${match.surah?.number}?ayah=${match.numberInSurah}`}
                        className="font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100"
                      >
                        {match.surah?.englishName} · Ayah {match.numberInSurah}
                      </Link>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {match.surah?.englishNameTranslation}
                      </p>
                    </div>
                    <p className="quran-arabic text-xl text-slate-700 dark:text-slate-300" dir="rtl">
                      {match.surah?.name}
                    </p>
                  </div>
                  <p className="mt-4 leading-7 text-slate-700 dark:text-slate-300">{match.text}</p>
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
