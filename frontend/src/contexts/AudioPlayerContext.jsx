import { createContext, useContext, useMemo, useState } from 'react';

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  function playQueue(tracks, index = 0) {
    const playableTracks = tracks.filter((track) => track.audioUrl);
    const target = tracks[index];
    const playableIndex = playableTracks.findIndex((track) => track.id === target?.id);

    setQueue(playableTracks);
    setCurrentIndex(playableIndex >= 0 ? playableIndex : 0);
  }

  function playNext() {
    setCurrentIndex((index) => (index < queue.length - 1 ? index + 1 : index));
  }

  function playPrevious() {
    setCurrentIndex((index) => (index > 0 ? index - 1 : index));
  }

  const value = useMemo(
    () => ({
      queue,
      currentTrack,
      currentIndex,
      canPlayNext: currentIndex >= 0 && currentIndex < queue.length - 1,
      canPlayPrevious: currentIndex > 0,
      playQueue,
      playNext,
      playPrevious,
    }),
    [queue, currentTrack, currentIndex],
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error('useAudioPlayer must be used inside AudioPlayerProvider.');
  }

  return context;
}
