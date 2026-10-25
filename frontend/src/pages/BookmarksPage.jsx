import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { getBookmarks, deleteBookmark } from "../api/bookmarkApi";
import { getSurah } from "../api/quranApi";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBookmarks() {
      setLoading(true);
      setError("");

      try {
        const savedBookmarks = await getBookmarks();

        if (cancelled) return;

        if (savedBookmarks.length === 0) {
          setBookmarks([]);
          return;
        }

        const surahNumbers = [
          ...new Set(savedBookmarks.map((item) => item.surah_number)),
        ];

        const surahResults = await Promise.all(
          surahNumbers.map(async (surahNumber) => {
            const surah = await getSurah(surahNumber, {
              translation: "en.sahih",
            });

            return [surahNumber, surah];
          }),
        );

        if (cancelled) return;

        const surahsByNumber = new Map(surahResults);

        const enrichedBookmarks = savedBookmarks.map((bookmark) => {
          const surah = surahsByNumber.get(bookmark.surah_number);

          const ayah = surah?.ayahs.find(
            (item) => item.numberInSurah === bookmark.ayah_number,
          );

          let ayahText = ayah?.text ?? "";

          // Match the display behavior of the Quran reader.
          if (
            ayah &&
            bookmark.ayah_number === 1 &&
            bookmark.surah_number !== 1 &&
            bookmark.surah_number !== 9
          ) {
            ayahText = ayahText.replace(
              /^بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ\s*/,
              "",
            );
          }

          return {
            ...bookmark,
            surahName: surah?.englishName ?? `Surah ${bookmark.surah_number}`,
            surahArabicName: surah?.name ?? "",
            ayahText,
            translationText: ayah?.translation?.text ?? "",
          };
        });

        setBookmarks(enrichedBookmarks);
      } catch (exception) {
        if (!cancelled) {
          setError(
            exception.response?.data?.message ??
              "Could not load your saved ayahs. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookmarks();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(bookmarkId) {
    setDeletingId(bookmarkId);
    setError("");

    try {
      await deleteBookmark(bookmarkId);

      setBookmarks((current) =>
        current.filter((bookmark) => bookmark.id !== bookmarkId),
      );
    } catch (exception) {
      setError(
        exception.response?.data?.message ??
          "Could not remove this bookmark. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/surahs"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Surahs
      </Link>

      <header className="mt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            <Bookmark size={23} />
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">
              Saved Ayahs
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your personal collection of saved verses.
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mt-6">
          <ErrorState message={error} />
        </div>
      )}

      {loading && (
        <div className="mt-8">
          <LoadingState label="Loading saved ayahs..." />
        </div>
      )}

      {!loading && !error && bookmarks.length === 0 && (
        <section className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-white/15">
          <Bookmark className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            No saved ayahs yet
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Open a Surah and select an ayah to save it here.
          </p>

          <Link
            to="/surahs"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            Browse Surahs
          </Link>
        </section>
      )}

      {!loading && bookmarks.length > 0 && (
        <section className="mt-8 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {bookmarks.length} saved {bookmarks.length === 1 ? "ayah" : "ayahs"}
          </p>

          {bookmarks.map((bookmark) => (
            <article
              key={bookmark.id}
              className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {bookmark.surahName}
                    {bookmark.surahArabicName && (
                      <span className="ml-2 font-normal text-emerald-700 dark:text-emerald-300">
                        {bookmark.surahArabicName}
                      </span>
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Ayah {bookmark.ayah_number}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/surah/${bookmark.surah_number}?ayah=${bookmark.ayah_number}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-700/20 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-white/10"
                    title="Open this ayah"
                    aria-label={`Open ${bookmark.surahName}, ayah ${bookmark.ayah_number}`}
                  >
                    <ExternalLink size={17} />
                  </Link>

                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(bookmark.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/20 text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-900/20"
                    title="Remove bookmark"
                    aria-label={`Remove bookmark for ${bookmark.surahName}, ayah ${bookmark.ayah_number}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              {bookmark.ayahText ? (
                <p
                  dir="rtl"
                  className="quran-arabic mt-6 text-right text-3xl leading-[2.3] text-emerald-950 dark:text-emerald-100"
                >
                  {bookmark.ayahText}
                </p>
              ) : (
                <p className="mt-5 text-sm text-amber-700 dark:text-amber-300">
                  The Arabic text could not be loaded.
                </p>
              )}

              {bookmark.translationText && (
                <p
                  dir="ltr"
                  className="mt-4 border-t border-slate-200 pt-4 text-left text-sm leading-7 text-slate-600 dark:border-white/10 dark:text-slate-300"
                >
                  {bookmark.translationText}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default BookmarksPage;
