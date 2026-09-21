import { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

function formatTime(value) {
  if (!Number.isFinite(value)) {
    return '0:00';
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function AudioPlayer() {
  const audioRef = useRef(null);
  const { currentTrack, canPlayNext, canPlayPrevious, playNext, playPrevious } = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) {
      return;
    }

    audioRef.current.load();
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  function togglePlayback() {
    if (!audioRef.current || !currentTrack) {
      return;
    }

    if (audioRef.current.paused) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
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
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => {
          setIsPlaying(false);
          if (canPlayNext) {
            playNext();
          }
        }}
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {currentTrack ? currentTrack.title : 'Select an ayah to play'}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {currentTrack?.subtitle ?? 'Verse-by-verse recitation will appear here.'}
          </p>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={playPrevious}
            disabled={!canPlayPrevious}
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Previous ayah"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!currentTrack}
            className="rounded-full bg-emerald-700 p-3 text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={playNext}
            disabled={!canPlayNext}
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Next ayah"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <span className="w-12 text-right text-xs text-slate-500 dark:text-slate-400">
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="h-1 flex-1 accent-emerald-700"
            aria-label="Audio progress"
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
            aria-label="Audio volume"
          />
        </label>
      </div>
    </div>
  );
}

export default AudioPlayer;
