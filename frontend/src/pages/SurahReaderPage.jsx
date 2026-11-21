import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  CircleAlert,
  Languages,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { getAyahTafsir, getEditions, getSurah, getSurahAudio } from "../api/quranApi";
import { getBookmarks, saveBookmark, deleteBookmark } from "../api/bookmarkApi";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTranslation } from "../hooks/useTranslation";

function withAudioEdition(surah, audioData) {
  const audioByAyah = new Map(
    audioData.ayahs.map((ayah) => [
      ayah.numberInSurah,
      ayah.audio,
    ]),
  );

  return {
    ...surah,
    audioEdition: audioData.edition,
    ayahs: surah.ayahs.map((ayah) => ({
      ...ayah,
      audio: audioByAyah.get(ayah.numberInSurah) ?? {
        url: null,
        secondary: [],
      },
    })),
  };
}

function SurahReaderPage() {
  const { number } = useParams();
  const [searchParams] = useSearchParams();
  const ayahFromUrl = Number(searchParams.get("ayah")) || null;

  const {
    currentTrack,
    playbackState,
    playbackTrackId,
    playQueue,
    queueSyncError,
    retryQueueSync,
    setTrackPlaybackState,
  } = useAudioPlayer();
  const { audioEdition, language } = usePreferences();
  const { t } = useTranslation();

  const [surah, setSurah] = useState(null);
  const [editions, setEditions] = useState([]);
  const [translation, setTranslation] = useState("en.sahih");
  const [fontSize, setFontSize] = useState(36);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [tafsirData, setTafsirData] = useState(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const [tafsirRetry, setTafsirRetry] = useState(0);
  const tafsirCacheRef = useRef(new Map());
  const tafsirRequestIdRef = useRef(0);

  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkActionKey, setBookmarkActionKey] = useState(null);
  const [bookmarkError, setBookmarkError] = useState("");
  const audioEditionRef = useRef(audioEdition);
  const previousAudioEditionRef = useRef(audioEdition);
  audioEditionRef.current = audioEdition;

  useEffect(() => {
    let cancelled = false;

    getBookmarks()
      .then((items) => {
        if (!cancelled) {
          setBookmarks(items);
        }
      })
      .catch((exception) => {
        if (!cancelled) {
          console.error("Could not load bookmarks:", exception);
          setBookmarkError("reader.bookmarkLoadError");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasAyahFromUrl = Boolean(
    surah?.ayahs.some((ayah) => ayah.numberInSurah === ayahFromUrl),
  );

  // Select the ayah from the URL without clearing manual selection when audio data refreshes.
  useEffect(() => {
    if (!surah) {
      return;
    }

    if (!ayahFromUrl) {
      setSelectedAyah(null);
      return;
    }

    if (hasAyahFromUrl) {
      setSelectedAyah(ayahFromUrl);
    }
  }, [surah?.number, ayahFromUrl, hasAyahFromUrl]);

  // Load tafsir only for the selected ayah; keep responses cached for this page.
  useEffect(() => {
    if (!selectedAyah) {
      tafsirRequestIdRef.current += 1;
      setTafsirData(null);
      setTafsirLoading(false);
      setTafsirError(false);
      return undefined;
    }

    const cacheKey = `${number}:${selectedAyah}`;
    const cachedTafsir = tafsirCacheRef.current.get(cacheKey);

    if (cachedTafsir) {
      setTafsirData(cachedTafsir);
      setTafsirLoading(false);
      setTafsirError(false);
      return undefined;
    }

    let cancelled = false;
    const requestId = ++tafsirRequestIdRef.current;

    setTafsirData(null);
    setTafsirLoading(true);
    setTafsirError(false);

    getAyahTafsir(number, selectedAyah)
      .then((data) => {
        if (cancelled || requestId !== tafsirRequestIdRef.current) {
          return;
        }

        tafsirCacheRef.current.set(cacheKey, data);
        setTafsirData(data);
      })
      .catch((exception) => {
        if (cancelled || requestId !== tafsirRequestIdRef.current) {
          return;
        }

        console.error("Could not load ayah tafsir:", exception);
        setTafsirError(true);
      })
      .finally(() => {
        if (!cancelled && requestId === tafsirRequestIdRef.current) {
          setTafsirLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [number, selectedAyah, tafsirRetry]);

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
    let cancelled = false;
    const requestedEdition = audioEditionRef.current;

    setLoading(true);
    setError("");

    getSurah(number, { translation, audio: requestedEdition })
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (audioEditionRef.current === requestedEdition) {
          setSurah(data);
          return;
        }

        const latestEdition = audioEditionRef.current;
        return getSurahAudio(number, latestEdition).then((audioData) => {
          if (!cancelled && audioEditionRef.current === latestEdition) {
            setSurah(withAudioEdition(data, audioData));
          }
        });
      })
      .catch((exception) => {
        if (!cancelled) {
          console.error("Could not load Surah:", exception);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [number, translation]);

  useEffect(() => {
    if (previousAudioEditionRef.current === audioEdition) {
      return undefined;
    }

    previousAudioEditionRef.current = audioEdition;
    const surahNumber = Number(number);
    let cancelled = false;

    getSurahAudio(surahNumber, audioEdition)
      .then((audioData) => {
        if (cancelled || audioEditionRef.current !== audioEdition) {
          return;
        }

        setSurah((currentSurah) =>
          currentSurah?.number === surahNumber
            ? withAudioEdition(currentSurah, audioData)
            : currentSurah,
        );
      })
      .catch((exception) => {
        if (!cancelled) {
          console.error("Could not load selected reciter audio:", exception);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [audioEdition, number]);

  // Build audio tracks for all ayahs.
  const tracks = useMemo(() => {
    if (!surah) {
      return [];
    }

    return surah.ayahs.map((ayah) => ({
      id: `${surah.number}:${ayah.numberInSurah}`,
      title: `${surah.englishName} · Ayah ${ayah.numberInSurah}`,
      subtitle: surah.audioEdition?.englishName,
      surahNumber: surah.number,
      audioEdition: surah.audioEdition?.identifier,
      surahEnglishName: surah.englishName,
      surahArabicName: surah.name,
      ayahNumber: ayah.numberInSurah,
      audioUrl: ayah.audio?.url,
    }));
  }, [surah]);

  function handleAyahClick(ayahNumber) {
    setSelectedAyah((current) => (current === ayahNumber ? null : ayahNumber));
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/surahs"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("common.backToSurahs")}
      </Link>

      {loading && (
        <div className="mt-8">
          <LoadingState label={t("reader.loading")} />
        </div>
      )}

      {!loading && error && (
        <div className="mt-8">
          <ErrorState message={t("reader.loadError")} />
        </div>
      )}

      {!loading && !error && surah && (
        <>
          {/* Surah Header */}
          <section className="mt-8 rounded-lg border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  {t("reader.surahNumber", { number: surah.number })}
                </p>

                <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
                  {language === "ar" ? surah.name : surah.englishName}
                </h1>

                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {language === "en" && (
                    <>{surah.englishNameTranslation} · </>
                  )}
                  {t("reader.ayahCount", { count: surah.numberOfAyahs })}
                  {language === "en" && (
                    <>
                      {" · "}
                      {surah.revelationType === "Medinan"
                        ? t("reader.medinan")
                        : t("reader.meccan")}
                    </>
                  )}
                </p>
              </div>

              <p
                className="quran-arabic text-end text-5xl text-emerald-950 dark:text-emerald-100"
                dir="rtl"
              >
                {surah.name}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* English translation selector */}
              {language === "en" && (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Languages className="h-4 w-4" />
                    {t("reader.translation")}
                  </span>

                  <select
                    value={translation}
                    onChange={(event) => setTranslation(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="en.sahih">Saheeh International</option>

                    {editions
                      .filter((edition) => edition.identifier !== "en.sahih")
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
              )}

              {/* Font Size */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("reader.arabicFontSize")}
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

          {bookmarkError && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
            >
              {t(bookmarkError)}
            </p>
          )}

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
              className="quran-arabic text-end leading-[2.5] text-slate-900 dark:text-white"
              style={{ fontSize: `${fontSize}px` }}
            >
              {surah.ayahs.map((ayah, index) => {
                const isSelected = selectedAyah === ayah.numberInSurah;

                const trackId = `${surah.number}:${ayah.numberInSurah}`;
                const isCurrent = currentTrack?.id === trackId;
                const ayahPlaybackState =
                  playbackTrackId === trackId ? playbackState : "idle";

                let text = ayah.text;

                // Remove Bismillah from the first ayah because
                // it is displayed separately above the reader.
                if (index === 0 && surah.number !== 1 && surah.number !== 9) {
                  text = text.replace(
                    /^بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ\s*/,
                    "",
                  );
                }

                return (
                  <Fragment key={ayah.number}>
                    {/* Ayah */}
                    <span
                      id={`ayah-${ayah.numberInSurah}`}
                      onClick={() => handleAyahClick(ayah.numberInSurah)}
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

                    {/* Translation && save */}

                    {isSelected && (
                      <div
                        dir={language === "ar" ? "rtl" : "ltr"}
                        className="my-5 flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-start font-sans text-base leading-8 text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
                      >
                        <span className="flex shrink-0 flex-col gap-2">
                          {(() => {
                            const bookmark = bookmarks.find(
                              (item) =>
                                item.surah_number === surah.number &&
                                item.ayah_number === ayah.numberInSurah,
                            );

                            const isBookmarked = Boolean(bookmark);
                            const isSaving =
                              bookmarkActionKey ===
                              `${surah.number}:${ayah.numberInSurah}`;

                            return (
                              <>
                                <button
                                  type="button"
                                  disabled={bookmarkActionKey !== null}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleBookmarkToggle(ayah.numberInSurah);
                                  }}
                                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-wait disabled:opacity-50 ${
                                    isBookmarked
                                      ? "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                      : "border-slate-300 bg-white text-slate-600 hover:border-amber-500 hover:text-amber-700 dark:border-white/20 dark:bg-slate-800 dark:text-slate-300"
                                  }`}
                                  title={
                                    isSaving
                                      ? t("reader.updatingBookmark")
                                      : isBookmarked
                                        ? t("reader.removeBookmark")
                                        : t("reader.saveAyah", {
                                            number: ayah.numberInSurah,
                                          })
                                  }
                                  aria-label={
                                    isBookmarked
                                      ? t("reader.removeBookmark")
                                      : t("reader.saveAyah", {
                                          number: ayah.numberInSurah,
                                        })
                                  }
                                  aria-pressed={isBookmarked}
                                >
                                  <Bookmark
                                    size={17}
                                    fill={isBookmarked ? "currentColor" : "none"}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (
                                      isCurrent &&
                                      ayahPlaybackState === "playing"
                                    ) {
                                      setTrackPlaybackState(trackId, "paused");
                                    } else if (
                                      isCurrent &&
                                      ayahPlaybackState === "error" &&
                                      queueSyncError
                                    ) {
                                      retryQueueSync();
                                    } else {
                                      playQueue(tracks, index);
                                    }
                                  }}
                                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition ${
                                    ayahPlaybackState === "error"
                                      ? "bg-red-700 hover:bg-red-800"
                                      : "bg-emerald-700 hover:bg-emerald-800"
                                  }`}
                                  title={
                                    ayahPlaybackState === "loading"
                                      ? t("reader.audioLoading")
                                      : ayahPlaybackState === "playing"
                                        ? t("reader.pauseAyah")
                                        : ayahPlaybackState === "paused"
                                          ? t("reader.audioPaused")
                                          : ayahPlaybackState === "error"
                                            ? t("reader.audioError")
                                            : t("reader.playAyah", {
                                                number: ayah.numberInSurah,
                                              })
                                  }
                                  aria-label={
                                    ayahPlaybackState === "loading"
                                      ? t("reader.audioLoading")
                                      : ayahPlaybackState === "playing"
                                        ? t("reader.pauseAyah")
                                        : ayahPlaybackState === "paused"
                                          ? t("reader.playAyah", {
                                              number: ayah.numberInSurah,
                                            })
                                          : ayahPlaybackState === "error"
                                            ? t("reader.audioError")
                                            : t("reader.playAyah", {
                                                number: ayah.numberInSurah,
                                              })
                                  }
                                >
                                  {ayahPlaybackState === "loading" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : ayahPlaybackState === "playing" ? (
                                    <Pause className="h-4 w-4" />
                                  ) : ayahPlaybackState === "error" ? (
                                    <CircleAlert className="h-4 w-4" />
                                  ) : (
                                    <Play size={14} fill="currentColor" />
                                  )}
                                </button>
                              </>
                            );
                          })()}
                        </span>

                        <div className="min-w-0 flex-1 space-y-4">
                          {language === "en" && ayah.translation?.text && (
                            <section>
                              <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {t("reader.translation")}
                              </h3>
                              <p>{ayah.translation.text}</p>
                            </section>
                          )}

                          <section>
                            <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {t("reader.tafsir")}
                            </h3>

                            {tafsirLoading && (
                              <p className="flex items-center gap-2 text-sm" role="status">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("reader.tafsirLoading")}
                              </p>
                            )}

                            {tafsirError && (
                              <div className="flex flex-wrap items-center gap-3 text-sm" role="alert">
                                <span>{t("reader.tafsirError")}</span>
                                <button
                                  type="button"
                                  onClick={() => setTafsirRetry((value) => value + 1)}
                                  className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
                                >
                                  {t("common.tryAgain")}
                                </button>
                              </div>
                            )}

                            {!tafsirLoading && !tafsirError && tafsirData && (() => {
                              const languageId = language === "ar" ? 1 : 4;
                              const book = tafsirData.books?.find(
                                (item) => Number(item.language_id) === languageId,
                              );

                              if (!book) {
                                return <p>{t("reader.tafsirUnavailable")}</p>;
                              }

                              const range = book.range;
                              const isCoveredByEarlierAyah =
                                range?.isShared &&
                                selectedAyah > Number(range.startAyah) &&
                                selectedAyah <= Number(range.endAyah);

                              if (isCoveredByEarlierAyah) {
                                return (
                                  <p>{t("reader.tafsirIncludedInAyah", {
                                    number: range.startAyah,
                                  })}</p>
                                );
                              }

                              return <p className="whitespace-pre-line">{book.plain_text || book.text}</p>;
                            })()}
                          </section>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );

  async function handleBookmarkToggle(ayahNumber) {
    const actionKey = `${surah.number}:${ayahNumber}`;

    if (bookmarkActionKey !== null) {
      return;
    }

    const existingBookmark = bookmarks.find(
      (bookmark) =>
        bookmark.surah_number === surah.number &&
        bookmark.ayah_number === ayahNumber,
    );

    setBookmarkActionKey(actionKey);
    setBookmarkError("");

    try {
      if (existingBookmark) {
        await deleteBookmark(existingBookmark.id);

        setBookmarks((current) =>
          current.filter((bookmark) => bookmark.id !== existingBookmark.id),
        );
      } else {
        const savedBookmark = await saveBookmark(surah.number, ayahNumber);

        setBookmarks((current) => {
          const alreadyExists = current.some(
            (bookmark) => bookmark.id === savedBookmark.id,
          );

          return alreadyExists ? current : [savedBookmark, ...current];
        });
      }
    } catch (exception) {
      console.error("Could not update bookmark:", exception);
      setBookmarkError("reader.bookmarkUpdateError");
    } finally {
      setBookmarkActionKey(null);
    }
  }
}

export default SurahReaderPage;
