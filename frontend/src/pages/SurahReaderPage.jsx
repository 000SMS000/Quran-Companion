import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Languages, Play } from "lucide-react";
import { getEditions, getSurah } from "../api/quranApi";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

function SurahReaderPage() {
  const { number } = useParams();
  const [searchParams] = useSearchParams();
  const ayahFromUrl = Number(searchParams.get("ayah")) || null;

  const { currentTrack, playQueue } = useAudioPlayer();

  const [surah, setSurah] = useState(null);
  const [editions, setEditions] = useState([]);
  const [translation, setTranslation] = useState("en.sahih");
  const [fontSize, setFontSize] = useState(36);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAyah, setSelectedAyah] = useState(null);

  // Select the ayah from the URL.
  useEffect(() => {
    if (!surah) {
      return;
    }

    if (!ayahFromUrl) {
      setSelectedAyah(null);
      return;
    }

    const exists = surah.ayahs.some(
      (ayah) => ayah.numberInSurah === ayahFromUrl,
    );

    if (exists) {
      setSelectedAyah(ayahFromUrl);
    }
  }, [surah, ayahFromUrl]);

  // Scroll automatically to the selected ayah.
  useEffect(() => {
    if (!selectedAyah) {
      return;
    }

    const element = document.getElementById(`ayah-${selectedAyah}`);

    if (!element) {
      return;
    }

    requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [selectedAyah]);

  // Load available English translations.
  useEffect(() => {
    getEditions({ language: "en" })
      .then((items) =>
        setEditions(items.filter((edition) => edition.identifier)),
      )
      .catch(() => setEditions([]));
  }, []);

  // Load the selected Surah.
  useEffect(() => {
    setLoading(true);
    setError("");

    getSurah(number, { translation })
      .then(setSurah)
      .catch((exception) =>
        setError(exception.response?.data?.message ?? exception.message),
      )
      .finally(() => setLoading(false));
  }, [number, translation]);

  // Build audio tracks for all ayahs.
  const tracks = useMemo(() => {
    if (!surah) {
      return [];
    }

    return surah.ayahs.map((ayah) => ({
      id: `${surah.number}:${ayah.numberInSurah}`,
      title: `${surah.englishName} · Ayah ${ayah.numberInSurah}`,
      subtitle: surah.audioEdition?.englishName ?? "Quran recitation",
      audioUrl: ayah.audio?.url,
    }));
  }, [surah]);

  function handleAyahClick(ayahNumber) {
    setSelectedAyah((current) =>
      current === ayahNumber ? null : ayahNumber,
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/surahs"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Surahs
      </Link>

      {loading && (
        <div className="mt-8">
          <LoadingState label="Loading Surah..." />
        </div>
      )}

      {!loading && error && (
        <div className="mt-8">
          <ErrorState message={error} />
        </div>
      )}

      {!loading && !error && surah && (
        <>
          {/* Surah Header */}
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
                  {surah.englishNameTranslation} · {surah.numberOfAyahs} ayahs ·{" "}
                  {surah.revelationType}
                </p>
              </div>

              <p
                className="quran-arabic text-right text-5xl text-emerald-950 dark:text-emerald-100"
                dir="rtl"
              >
                {surah.name}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Translation */}
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Languages className="h-4 w-4" />
                  Translation
                </span>

                <select
                  value={translation}
                  onChange={(event) =>
                    setTranslation(event.target.value)
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <option value="en.sahih">
                    Saheeh International
                  </option>

                  {editions
                    .filter(
                      (edition) =>
                        edition.identifier !== "en.sahih",
                    )
                    .slice(0, 20)
                    .map((edition) => (
                      <option
                        key={edition.identifier}
                        value={edition.identifier}
                      >
                        {edition.englishName || edition.name}
                      </option>
                    ))}
                </select>
              </label>

              {/* Font Size */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Arabic font size
                </span>

                <input
                  type="range"
                  min="28"
                  max="52"
                  value={fontSize}
                  onChange={(event) =>
                    setFontSize(Number(event.target.value))
                  }
                  className="w-full accent-emerald-700"
                />
              </label>
            </div>
          </section>

          {/* Quran Reader */}
          <section className="mt-6 rounded-lg border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-10">
            {/* Bismillah */}
            {surah.number !== 9 && (
              <div
                className="quran-arabic mb-8 text-center text-2xl leading-loose text-emerald-900 dark:text-emerald-100"
                dir="rtl"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}

            <div
              dir="rtl"
              className="quran-arabic text-right leading-[2.5] text-slate-900 dark:text-white"
              style={{ fontSize: `${fontSize}px` }}
            >
              {surah.ayahs.map((ayah, index) => {
                const isSelected =
                  selectedAyah === ayah.numberInSurah;

                const isCurrent =
                  currentTrack?.id ===
                  `${surah.number}:${ayah.numberInSurah}`;

                let text = ayah.text;

                // Remove Bismillah from the first ayah because
                // it is displayed separately above the reader.
                if (
                  index === 0 &&
                  surah.number !== 1 &&
                  surah.number !== 9
                ) {
                  text = text.replace(
                    /^بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ\s*/,
                    "",
                  );
                }

                return (
                  <span key={ayah.number}>
                    {/* Ayah */}
                    <span
                      id={`ayah-${ayah.numberInSurah}`}
                      onClick={() =>
                        handleAyahClick(ayah.numberInSurah)
                      }
                      className={`cursor-pointer rounded-md transition ${
                        isSelected
                          ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-100"
                          : "hover:bg-emerald-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {text}
                    </span>

                    {/* Ayah number */}
                    <span
                      className={`mx-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full border align-middle font-sans text-xs font-semibold ${
                        isCurrent
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-emerald-700/30 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}
                    >
                      {ayah.numberInSurah}
                    </span>

                    {/* Translation */}
                    {isSelected && ayah.translation?.text && (
                      <span
                        dir="ltr"
                        className="my-5 flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left font-sans text-base leading-8 text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            playQueue(tracks, index);
                          }}
                          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition hover:bg-emerald-800"
                          title={`Play Ayah ${ayah.numberInSurah}`}
                          aria-label={`Play Ayah ${ayah.numberInSurah}`}
                        >
                          <Play
                            size={16}
                            fill="currentColor"
                          />
                        </button>

                        <span className="flex-1">
                          {ayah.translation.text}
                        </span>
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default SurahReaderPage;