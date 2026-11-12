import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useTranslation } from "../hooks/useTranslation";

function formatTime(value) {
  if (!Number.isFinite(value)) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function getPlaybackErrorKey(error, mediaError) {
  if (mediaError?.code === 2) {
    return "audioPlayer.networkError";
  }

  if (mediaError?.code === 3 || mediaError?.code === 4) {
    return "audioPlayer.invalidAudio";
  }

  if (error?.name === "NotAllowedError") {
    return "audioPlayer.playbackBlocked";
  }

  return "audioPlayer.playbackError";
}

function AudioPlayer() {
  const audioRef = useRef(null);
  const { audioEdition, language } = usePreferences();
  const { t } = useTranslation();

  const {
    currentTrack,
    canPlayNext,
    canPlayPrevious,
    playNext,
    playPrevious,
    playbackState,
    playbackIntent,
    playbackTrackId,
    playbackRequestId,
    playbackRequestedAt,
    queueSyncError,
    retryQueueSync,
    setTrackPlaybackState,
    setTrackPlaybackIntent,
  } = useAudioPlayer();

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [playbackErrorKey, setPlaybackErrorKey] = useState(
    "audioPlayer.playbackError",
  );
  const generationRef = useRef(0);
  const shouldAutoplayRef = useRef(Boolean(currentTrack));
  const playRequestedRef = useRef(false);
  const playAttemptRef = useRef(0);
  const hasPlayedRef = useRef(false);
  const audioErrorRef = useRef(false);
  const lastRetryAttemptRef = useRef(retryAttempt);
  const currentTrackRef = useRef(currentTrack);
  const audioEditionRef = useRef(audioEdition);
  const navigationRef = useRef({ canPlayNext, playNext });
  currentTrackRef.current = currentTrack;
  audioEditionRef.current = audioEdition;
  navigationRef.current = { canPlayNext, playNext };

  const currentTrackTitle = currentTrack
    ? t("audioPlayer.trackTitle", {
        surah:
          language === "ar"
            ? currentTrack.surahArabicName ?? currentTrack.title
            : currentTrack.surahEnglishName ?? currentTrack.title,
        number: currentTrack.ayahNumber,
      })
    : t("audioPlayer.selectAyah");

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack?.audioUrl) {
      shouldAutoplayRef.current = false;
      setProgress(0);
      setDuration(0);
      return;
    }

    if (
      currentTrack.audioEdition &&
      currentTrack.audioEdition !== audioEdition
    ) {
      shouldAutoplayRef.current = playbackIntent;
      playRequestedRef.current = false;
      playAttemptRef.current += 1;
      setTrackPlaybackState(
        currentTrack.id,
        queueSyncError ? "error" : "loading",
      );
      audio.pause();
      return;
    }

    shouldAutoplayRef.current = playbackIntent;

    const generation = ++generationRef.current;
    const isRetry = retryAttempt !== lastRetryAttemptRef.current;
    lastRetryAttemptRef.current = retryAttempt;
    playAttemptRef.current += 1;
    const sourceUrl = currentTrack.audioUrl;
    const trackId = currentTrack.id;
    const trackEdition = currentTrack.audioEdition;
    const selectionTime = playbackRequestedAt ?? performance.now();
    const isCurrent = () =>
      generationRef.current === generation &&
      currentTrackRef.current?.id === trackId &&
      currentTrackRef.current?.audioUrl === sourceUrl &&
      currentTrackRef.current?.audioEdition === trackEdition &&
      (!trackEdition || audioEditionRef.current === trackEdition) &&
      audio.src === sourceUrl;

    setTrackPlaybackState(trackId, "loading");
    setProgress(0);
    setDuration(0);
    playRequestedRef.current = false;
    hasPlayedRef.current = false;
    audioErrorRef.current = false;
    audio.pause();

    const failPlayback = (error) => {
      if (!isCurrent() || audioErrorRef.current) {
        return;
      }

      const mediaError = audio.error;
      const errorName = error?.name;
      const errorKey = getPlaybackErrorKey(error, mediaError);

      if (import.meta.env.DEV) {
        let safeSource = sourceUrl;
        try {
          const parsedSource = new URL(sourceUrl);
          safeSource = `${parsedSource.origin}${parsedSource.pathname}`;
        } catch {
          safeSource = "invalid audio URL";
        }
        console.warn("Audio playback failed:", {
          trackId,
          audioEdition: trackEdition,
          source: safeSource,
          mediaErrorCode: mediaError?.code,
          mediaErrorMessage: mediaError?.message,
          rejectionName: errorName,
          rejectionMessage: error?.message,
        });
      }

      audioErrorRef.current = true;
      shouldAutoplayRef.current = false;
      playRequestedRef.current = false;
      setPlaybackErrorKey(errorKey);
      setTrackPlaybackState(trackId, "error");
    };

    const startPlayback = async () => {
      if (!isCurrent() || !shouldAutoplayRef.current || playRequestedRef.current) {
        return;
      }

      playRequestedRef.current = true;
      const attempt = ++playAttemptRef.current;

      try {
        await audio.play();
      } catch (error) {
        if (playAttemptRef.current === attempt) {
          failPlayback(error);
        }
      }
    };

    const handleLoadStart = () => {
      if (isCurrent() && !audioErrorRef.current) {
        setTrackPlaybackState(trackId, "loading");
        if (import.meta.env.DEV) {
          console.debug("Audio source loading", {
            trackId,
            elapsedMs: performance.now() - selectionTime,
          });
        }
      }
    };
    const handleCanPlay = () => {
      if (!isCurrent() || audioErrorRef.current) {
        return;
      }

      if (import.meta.env.DEV) {
        console.debug("Audio canplay", {
          trackId,
          elapsedMs: performance.now() - selectionTime,
        });
      }

      if (!shouldAutoplayRef.current) {
        setTrackPlaybackState(trackId, "paused");
      }
    };
    const handlePlaying = () => {
      if (isCurrent() && !audioErrorRef.current) {
        hasPlayedRef.current = true;
        setTrackPlaybackState(trackId, "playing");
        if (import.meta.env.DEV) {
          console.debug("Audio playing", {
            trackId,
            elapsedMs: performance.now() - selectionTime,
          });
        }
      }
    };
    const handleWaiting = () => {
      if (
        isCurrent() &&
        !audioErrorRef.current &&
        shouldAutoplayRef.current
      ) {
        setTrackPlaybackState(trackId, "loading");
      }
    };
    const handlePause = () => {
      if (
        isCurrent() &&
        !audioErrorRef.current &&
        !audio.ended &&
        (!shouldAutoplayRef.current || hasPlayedRef.current)
      ) {
        shouldAutoplayRef.current = false;
        playRequestedRef.current = false;
        setTrackPlaybackState(trackId, "paused");
      }
    };
    const handleTimeUpdate = () => {
      if (isCurrent()) {
        setProgress(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      if (isCurrent()) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      if (!isCurrent()) {
        return;
      }

      if (navigationRef.current.canPlayNext) {
        navigationRef.current.playNext();
      } else {
        shouldAutoplayRef.current = false;
        setTrackPlaybackState(trackId, "paused");
      }
    };
    const handleError = () => failPlayback(audio.error);

    const listeners = [
      ["loadstart", handleLoadStart],
      ["canplay", handleCanPlay],
      ["playing", handlePlaying],
      ["waiting", handleWaiting],
      ["stalled", handleWaiting],
      ["pause", handlePause],
      ["timeupdate", handleTimeUpdate],
      ["loadedmetadata", handleLoadedMetadata],
      ["ended", handleEnded],
      ["error", handleError],
    ];
    listeners.forEach(([event, listener]) =>
      audio.addEventListener(event, listener),
    );
    if (import.meta.env.DEV) {
      console.debug("Audio source assigned", {
        trackId,
        audioEdition: trackEdition,
        selectionElapsedMs: performance.now() - selectionTime,
      });
    }
    audio.src = sourceUrl;
    if (isRetry) {
      audio.load();
    }
    startPlayback();

    return () => {
      generationRef.current += 1;
      listeners.forEach(([event, listener]) =>
        audio.removeEventListener(event, listener),
      );
      audio.pause();
    };
  }, [
    audioEdition,
    currentTrack?.audioEdition,
    currentTrack?.audioUrl,
    currentTrack?.id,
    playbackRequestId,
    playbackRequestedAt,
    queueSyncError,
    retryAttempt,
    setTrackPlaybackState,
  ]);

  useEffect(() => {
    const audio = audioRef.current;

    if (
      audio &&
      currentTrack?.id === playbackTrackId &&
      playbackState === "paused" &&
      !audio.paused
    ) {
      shouldAutoplayRef.current = false;
      playRequestedRef.current = false;
      playAttemptRef.current += 1;
      audio.pause();
    }
  }, [currentTrack?.id, playbackState, playbackTrackId]);

  // Update volume independently without reloading the track.
  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  function togglePlayback() {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    if (playbackState === "loading") {
      shouldAutoplayRef.current = false;
      playRequestedRef.current = false;
      playAttemptRef.current += 1;
      audio.pause();
      setTrackPlaybackState(currentTrack.id, "paused");
      return;
    }

    if (playbackState === "paused" && audio.paused) {
      shouldAutoplayRef.current = true;
      playRequestedRef.current = false;
      setTrackPlaybackIntent(currentTrack.id, true);
      const attempt = ++playAttemptRef.current;
      const generation = generationRef.current;
      setTrackPlaybackState(currentTrack.id, "loading");
      audio.play().catch((error) => {
        if (
          playAttemptRef.current !== attempt ||
          generationRef.current !== generation
        ) {
          return;
        }

        if (import.meta.env.DEV) {
          console.warn("Audio playback could not start:", {
            trackId: currentTrack.id,
            audioEdition: currentTrack.audioEdition,
            mediaErrorCode: audio.error?.code,
            mediaErrorMessage: audio.error?.message,
            rejectionName: error.name,
            rejectionMessage: error.message,
          });
        }
        shouldAutoplayRef.current = false;
        setPlaybackErrorKey(getPlaybackErrorKey(error, audio.error));
        setTrackPlaybackState(currentTrack.id, "error");
      });
    } else {
      shouldAutoplayRef.current = false;
      playRequestedRef.current = false;
      playAttemptRef.current += 1;
      audio.pause();
      setTrackPlaybackState(currentTrack.id, "paused");
    }
  }

  function retryPlayback() {
    if (queueSyncError || currentTrack?.audioEdition !== audioEdition) {
      setTrackPlaybackState(currentTrack.id, "loading");
      retryQueueSync();
      return;
    }

    shouldAutoplayRef.current = true;
    playRequestedRef.current = false;
    playAttemptRef.current += 1;
    setTrackPlaybackIntent(currentTrack.id, true);
    setTrackPlaybackState(currentTrack.id, "loading");
    setRetryAttempt((attempt) => attempt + 1);
  }

  function handleSeek(event) {
    const nextTime = Number(event.target.value);

    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }

    setProgress(nextTime);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-900/10 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
      <audio ref={audioRef} preload="metadata" />

      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {currentTrackTitle}
          </p>

          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {playbackState === "error" ? (
              <span role="alert" className="text-red-700 dark:text-red-300">
                {t(queueSyncError || currentTrack?.audioEdition !== audioEdition ? "audioPlayer.syncError" : playbackErrorKey)}{" "}
                <button
                  type="button"
                  onClick={retryPlayback}
                  className="ms-1 inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("audioPlayer.retry")}
                </button>
              </span>
            ) : (
              currentTrack?.subtitle ?? t("audioPlayer.recitation")
            )}
          </p>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={playPrevious}
            disabled={!canPlayPrevious}
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label={t("audioPlayer.previousAyah")}
          >
            <SkipBack className="h-5 w-5 rtl:-scale-x-100" />
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            disabled={
              !currentTrack ||
              playbackState === "error"
            }
            className="rounded-full bg-emerald-700 p-3 text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            aria-label={
              playbackState === "loading"
                ? t("audioPlayer.loading")
                : playbackState === "playing"
                  ? t("audioPlayer.pause")
                  : t("audioPlayer.play")
            }
          >
            {playbackState === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : playbackState === "playing" ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <span className="sr-only" role="status" aria-live="polite">
            {playbackState === "loading" ? t("audioPlayer.loading") : ""}
          </span>

          <button
            type="button"
            onClick={playNext}
            disabled={!canPlayNext}
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label={t("audioPlayer.nextAyah")}
          >
            <SkipForward className="h-5 w-5 rtl:-scale-x-100" />
          </button>

          <span className="w-12 text-end text-xs text-slate-500 dark:text-slate-400">
            {formatTime(progress)}
          </span>

          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="h-1 flex-1 accent-emerald-700"
            aria-label={t("audioPlayer.progress")}
          />

          <span className="w-12 text-xs text-slate-500 dark:text-slate-400">
            {formatTime(duration)}
          </span>
        </div>

        <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Volume2 className="h-4 w-4" />

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-24 accent-emerald-700"
            aria-label={t("audioPlayer.volume")}
          />
        </label>
      </div>
    </div>
  );
}

export default AudioPlayer;
