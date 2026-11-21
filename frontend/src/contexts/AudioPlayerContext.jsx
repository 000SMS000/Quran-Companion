import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePreferences } from './PreferencesContext';

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const { audioEdition } = usePreferences();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playbackState, setPlaybackState] = useState('idle');
  const [playbackIntent, setPlaybackIntent] = useState(false);
  const [playbackTrackId, setPlaybackTrackId] = useState(null);
  const [playbackRequestId, setPlaybackRequestId] = useState(0);
  const [playbackRequestedAt, setPlaybackRequestedAt] = useState(null);
  const queueSyncError = false;
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const activeTrackIdRef = useRef(playbackTrackId);
  const playbackStateRef = useRef(playbackState);
  const playbackIntentRef = useRef(playbackIntent);

  queueRef.current = queue;
  currentIndexRef.current = currentIndex;
  activeTrackIdRef.current = playbackTrackId;
  playbackStateRef.current = playbackState;
  playbackIntentRef.current = playbackIntent;

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const playQueue = useCallback((tracks, index = 0) => {
    const playableTracks = tracks.filter((track) => track.audioUrl);
    const target = tracks[index];
    const playableIndex = playableTracks.findIndex(
      (track) => track.id === target?.id,
    );
    const nextIndex = playableIndex;
    const selectedTrack = nextIndex >= 0 ? playableTracks[nextIndex] : null;
    const queueChanged =
      queueRef.current.length !== playableTracks.length ||
      queueRef.current.some(
        (track, trackIndex) =>
          track.id !== playableTracks[trackIndex]?.id ||
          track.audioUrl !== playableTracks[trackIndex]?.audioUrl ||
          track.audioEdition !== playableTracks[trackIndex]?.audioEdition,
      );

    if (queueChanged) {
      queueRef.current = playableTracks;
      setQueue(playableTracks);
    }

    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    const isSameActiveTrack = selectedTrack?.id === activeTrackIdRef.current;

    if (
      isSameActiveTrack &&
      (playbackStateRef.current === 'loading' ||
        playbackStateRef.current === 'playing') &&
      playbackIntentRef.current
    ) {
      return;
    }

    activeTrackIdRef.current = selectedTrack?.id ?? null;
    setPlaybackTrackId(selectedTrack?.id ?? null);
    playbackIntentRef.current = Boolean(selectedTrack);
    setPlaybackIntent(playbackIntentRef.current);
    playbackStateRef.current = selectedTrack ? 'loading' : 'idle';
    setPlaybackState(playbackStateRef.current);
    setPlaybackRequestId((requestId) => requestId + 1);
    const requestedAt = performance.now();
    setPlaybackRequestedAt(requestedAt);

    if (import.meta.env.DEV) {
      console.debug('Audio Ayah selection', {
        trackId: selectedTrack?.id,
        queueSelectionDurationMs: performance.now() - requestedAt,
      });
    }
  }, []);

  const setTrackPlaybackState = useCallback((trackId, nextState) => {
    if (activeTrackIdRef.current !== trackId) {
      return;
    }

    playbackStateRef.current = nextState;
    setPlaybackState(nextState);

    if (nextState === 'paused' || nextState === 'error') {
      playbackIntentRef.current = false;
      setPlaybackIntent(false);
    } else if (nextState === 'playing') {
      playbackIntentRef.current = true;
      setPlaybackIntent(true);
    }
  }, []);

  const setTrackPlaybackIntent = useCallback((trackId, shouldPlay) => {
    if (activeTrackIdRef.current !== trackId) {
      return;
    }

    playbackIntentRef.current = shouldPlay;
    setPlaybackIntent(shouldPlay);
  }, []);

  const selectRelativeTrack = useCallback((direction) => {
    const nextIndex = currentIndexRef.current + direction;

    if (nextIndex < 0 || nextIndex >= queueRef.current.length) {
      return;
    }

    const nextTrack = queueRef.current[nextIndex];
    currentIndexRef.current = nextIndex;
    activeTrackIdRef.current = nextTrack.id;
    playbackIntentRef.current = true;
    setPlaybackIntent(true);
    playbackStateRef.current = 'loading';
    setCurrentIndex(nextIndex);
    setPlaybackTrackId(nextTrack.id);
    setPlaybackState('loading');
    setPlaybackRequestId((requestId) => requestId + 1);
    setPlaybackRequestedAt(performance.now());
  }, []);

  const playNext = useCallback(() => {
    selectRelativeTrack(1);
  }, [selectRelativeTrack]);

  const playPrevious = useCallback(() => {
    selectRelativeTrack(-1);
  }, [selectRelativeTrack]);

  const retryQueueSync = useCallback(() => {
    setPlaybackRequestId((requestId) => requestId + 1);
    setPlaybackRequestedAt(performance.now());
  }, []);

  const value = useMemo(
    () => ({
      queue,
      currentTrack,
      currentIndex,
      playbackState,
      playbackIntent,
      playbackTrackId,
      playbackRequestId,
      playbackRequestedAt,
      queueSyncError,
      canPlayNext: currentIndex >= 0 && currentIndex < queue.length - 1,
      canPlayPrevious: currentIndex > 0,
      playQueue,
      playNext,
      playPrevious,
      retryQueueSync,
      setTrackPlaybackState,
      setTrackPlaybackIntent,
    }),
    [
      queue,
      currentTrack,
      currentIndex,
      playbackState,
      playbackIntent,
      playbackTrackId,
      playbackRequestId,
      playbackRequestedAt,
      queueSyncError,
      playQueue,
      playNext,
      playPrevious,
      retryQueueSync,
      setTrackPlaybackState,
      setTrackPlaybackIntent,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error('useAudioPlayer must be used inside AudioPlayerProvider.');
  }

  return context;
}
