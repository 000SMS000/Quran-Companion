import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getSurahs } from '../api/quranApi';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import SurahCard from '../components/SurahCard';

function SurahsPage() {
  const [surahs, setSurahs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSurahs()
      .then(setSurahs)
      .catch((exception) => setError(exception.response?.data?.message ?? exception.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredSurahs = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return surahs;
    }

    return surahs.filter((surah) =>
      [surah.name, surah.englishName, surah.englishNameTranslation, String(surah.number)]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(value)),
    );
  }, [surahs, query]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            Quran
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">Surahs</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Browse all 114 Surahs with ayah counts and revelation type.
          </p>
        </div>

        <label className="relative block w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter Surahs"
            className="w-full rounded-md border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>
      </div>

      <div className="mt-8">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSurahs.map((surah) => (
              <SurahCard key={surah.number} surah={surah} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default SurahsPage;
