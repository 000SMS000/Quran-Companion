import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Languages } from 'lucide-react';
import { getEditions, getSurah } from '../api/quranApi';
import AyahCard from '../components/AyahCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

function SurahReaderPage() {
  const { number } = useParams();
  const { currentTrack, playQueue } = useAudioPlayer();
  const [surah, setSurah] = useState(null);
  const [editions, setEditions] = useState([]);
  const [translation, setTranslation] = useState('en.sahih');
  const [fontSize, setFontSize] = useState(36);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getEditions({ language: 'en' })
      .then((items) => setEditions(items.filter((edition) => edition.identifier)))
      .catch(() => setEditions([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');

    getSurah(number, { translation })
      .then(setSurah)
      .catch((exception) => setError(exception.response?.data?.message ?? exception.message))
      .finally(() => setLoading(false));
  }, [number, translation]);

  const tracks = useMemo(() => {
    if (!surah) {
      return [];
    }

    return surah.ayahs.map((ayah) => ({
      id: `${surah.number}:${ayah.numberInSurah}`,
      title: `${surah.englishName} · Ayah ${ayah.numberInSurah}`,
      subtitle: surah.audioEdition?.englishName ?? 'Quran recitation',
      audioUrl: ayah.audio?.url,
    }));
  }, [surah]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/surahs"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Surahs
      </Link>

      {loading && <div className="mt-8"><LoadingState label="Loading Surah..." /></div>}
      {!loading && error && <div className="mt-8"><ErrorState message={error} /></div>}

      {!loading && !error && surah && (
        <>
          <section className="mt-8 rounded-lg border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  Surah {surah.number}
                </p>
                <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
                  {surah.englishName}
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {surah.englishNameTranslation} · {surah.numberOfAyahs} ayahs · {surah.revelationType}
                </p>
              </div>
              <p className="quran-arabic text-right text-5xl text-emerald-950 dark:text-emerald-100" dir="rtl">
                {surah.name}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Languages className="h-4 w-4" />
                  Translation
                </span>
                <select
                  value={translation}
                  onChange={(event) => setTranslation(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <option value="en.sahih">Saheeh International</option>
                  {editions
                    .filter((edition) => edition.identifier !== 'en.sahih')
                    .slice(0, 20)
                    .map((edition) => (
                      <option key={edition.identifier} value={edition.identifier}>
                        {edition.englishName || edition.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Arabic font size
                </span>
                <input
                  type="range"
                  min="28"
                  max="52"
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="w-full accent-emerald-700"
                />
              </label>
            </div>
          </section>

          <section className="mt-6 space-y-4" style={{ '--ayah-font-size': `${fontSize}px` }}>
            {surah.ayahs.map((ayah, index) => (
              <div key={ayah.number} className="[&_.quran-arabic]:text-[length:var(--ayah-font-size)]">
                <AyahCard
                  ayah={ayah}
                  surahName={surah.englishName}
                  translationEdition={surah.translationEdition}
                  isCurrent={currentTrack?.id === `${surah.number}:${ayah.numberInSurah}`}
                  onPlay={() => playQueue(tracks, index)}
                />
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

export default SurahReaderPage;
