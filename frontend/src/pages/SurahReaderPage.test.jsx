import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AudioPlayer from "../components/AudioPlayer";
import { getEditions, getSurah } from "../api/quranApi";
import { getBookmarks } from "../api/bookmarkApi";
import { AudioPlayerProvider } from "../contexts/AudioPlayerContext";
import {
  PreferencesProvider,
  usePreferences,
} from "../contexts/PreferencesContext";
import SurahReaderPage from "./SurahReaderPage";

vi.mock("../api/quranApi", () => ({
  getEditions: vi.fn(),
  getSurah: vi.fn(),
}));

vi.mock("../api/bookmarkApi", () => ({
  getBookmarks: vi.fn(),
  saveBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

const surahData = {
  number: 1,
  name: "سورة الاختبار",
  englishName: "Test Surah",
  englishNameTranslation: "The Test",
  numberOfAyahs: 2,
  revelationType: "Meccan",
  ayahs: [
    {
      number: 1,
      numberInSurah: 1,
      text: "AYAH_ONE",
      translation: { text: "Translation one" },
    },
    {
      number: 2,
      numberInSurah: 2,
      text: "AYAH_TWO",
      translation: { text: "Translation two" },
    },
  ],
};

function ReciterSwitcher() {
  const { setAudioEdition } = usePreferences();

  return (
    <button
      type="button"
      onClick={() => setAudioEdition("everyayah.alafasy.128")}
    >
      Change reciter
    </button>
  );
}

function renderReader() {
  return render(
    <PreferencesProvider>
      <AudioPlayerProvider>
        <MemoryRouter initialEntries={["/surah/1"]}>
          <Routes>
            <Route
              path="/surah/:number"
              element={
                <>
                  <SurahReaderPage />
                  <AudioPlayer />
                </>
              }
            />
          </Routes>
          <ReciterSwitcher />
        </MemoryRouter>
      </AudioPlayerProvider>
    </PreferencesProvider>,
  );
}

describe("SurahReaderPage audio controls", () => {
  let audioPlay;
  let audioPause;

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.spyOn(window.location, "reload").mockImplementation(() => {});
    getEditions.mockResolvedValue([]);
    getBookmarks.mockResolvedValue([]);
    getSurah.mockResolvedValue(surahData);

    HTMLElement.prototype.scrollIntoView = vi.fn();
    audioPlay = vi.fn(function () {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: false,
      });
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    });
    audioPause = vi.fn(function () {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: true,
      });
      this.dispatchEvent(new Event("pause"));
    });

    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: audioPlay,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: audioPause,
    });
  });

  it("only selects an Ayah when its text is clicked, then plays and pauses it", async () => {
    const { container } = renderReader();
    await screen.findByText("AYAH_ONE");
    const audio = container.querySelector("audio");

    await act(async () => fireEvent.click(screen.getAllByText("AYAH_ONE")[0]));
    expect(audioPlay).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getAllByText("AYAH_ONE")[0].className).toContain(
        "bg-emerald-100",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Play verse 1" }));
    expect(
      await screen.findByRole("button", { name: "Pause verse audio" }),
    ).toBeTruthy();
    expect(audioPlay).toHaveBeenCalledTimes(1);
    expect(audio.src).toBe(
      "https://everyayah.com/data/Minshawy_Murattal_128kbps/001001.mp3",
    );

    fireEvent.click(screen.getByRole("button", { name: "Pause verse audio" }));
    await waitFor(() => expect(audioPause).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "Play verse 1" }),
    ).toBeTruthy();

    await act(async () => fireEvent.click(screen.getByText("AYAH_TWO")));
    expect(audioPlay).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Play verse 2" }),
    ).toBeTruthy();
  });

  it("clears the active queue when the reciter changes and requires an explicit new play", async () => {
    const { container } = renderReader();
    await screen.findByText("AYAH_ONE");
    await act(async () => fireEvent.click(screen.getAllByText("AYAH_ONE")[0]));
    fireEvent.click(screen.getByRole("button", { name: "Play verse 1" }));
    await screen.findByRole("button", { name: "Pause verse audio" });

    fireEvent.click(screen.getByRole("button", { name: "Change reciter" }));

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalledTimes(1);
      expect(container.querySelector("audio").src).toBe("");
    });
    expect(audioPlay).toHaveBeenCalledTimes(1);
    expect(getSurah).toHaveBeenCalledTimes(1);

    await act(async () => fireEvent.click(screen.getByText("AYAH_ONE")));
    fireEvent.click(screen.getByRole("button", { name: "Play verse 1" }));

    expect(
      await screen.findByRole("button", { name: "Pause verse audio" }),
    ).toBeTruthy();
    expect(audioPlay).toHaveBeenCalledTimes(2);
    expect(container.querySelector("audio").src).toBe(
      "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
    );
  });

  it("does not resume playback automatically when the reciter changes while paused", async () => {
    const { container } = renderReader();
    await screen.findByText("AYAH_ONE");
    await act(async () => fireEvent.click(screen.getAllByText("AYAH_ONE")[0]));
    fireEvent.click(screen.getByRole("button", { name: "Play verse 1" }));
    await screen.findByRole("button", { name: "Pause verse audio" });
    fireEvent.click(screen.getByRole("button", { name: "Pause verse audio" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Play verse 1" })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Change reciter" }));

    await waitFor(() => {
      expect(container.querySelector("audio").src).toBe("");
    });
    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(audioPlay).toHaveBeenCalledTimes(1);
  });

  it("shows a retryable error when playback fails", async () => {
    audioPlay.mockImplementationOnce(() =>
      Promise.reject(new Error("NotSupportedError")),
    );
    const { container } = renderReader();
    await screen.findByText("AYAH_ONE");
    await act(async () => fireEvent.click(screen.getAllByText("AYAH_ONE")[0]));
    fireEvent.click(screen.getByRole("button", { name: "Play verse 1" }));

    expect(
      await screen.findByRole("button", {
        name: "Audio failed. Select to retry",
      }),
    ).toBeTruthy();
    expect(container.querySelector("audio").src).toBe(
      "https://everyayah.com/data/Minshawy_Murattal_128kbps/001001.mp3",
    );

    audioPlay.mockImplementation(function () {
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Audio failed. Select to retry",
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Pause verse audio" }),
    ).toBeTruthy();
  });

  it("shows loading immediately for a selected track while playback is pending", async () => {
    let startPlayback;
    audioPlay.mockImplementation(function () {
      const audio = this;
      return new Promise((resolve) => {
        startPlayback = () => {
          Object.defineProperty(audio, "paused", {
            configurable: true,
            value: false,
          });
          audio.dispatchEvent(new Event("playing"));
          resolve();
        };
      });
    });

    renderReader();
    await screen.findByText("AYAH_ONE");
    await act(async () => fireEvent.click(screen.getAllByText("AYAH_ONE")[0]));
    fireEvent.click(screen.getByRole("button", { name: "Play verse 1" }));

    expect(
      await screen.findByRole("button", { name: "Loading verse audio" }),
    ).toBeTruthy();
    expect(audioPlay).toHaveBeenCalledTimes(1);

    await act(async () => startPlayback());
    expect(
      await screen.findByRole("button", { name: "Pause verse audio" }),
    ).toBeTruthy();
  });
});
