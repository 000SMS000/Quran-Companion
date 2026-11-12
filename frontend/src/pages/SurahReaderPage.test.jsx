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
import {
  getEditions,
  getSurah,
  getSurahAudio,
} from "../api/quranApi";
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
  getSurahAudio: vi.fn(),
}));

vi.mock("../api/bookmarkApi", () => ({
  getBookmarks: vi.fn(),
  saveBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const surahData = {
  number: 1,
  name: "سورة الاختبار",
  englishName: "Test Surah",
  englishNameTranslation: "The Test",
  numberOfAyahs: 2,
  revelationType: "Meccan",
  audioEdition: { identifier: "ar.alafasy", englishName: "Alafasy" },
  ayahs: [
    {
      number: 1,
      numberInSurah: 1,
      text: "AYAH_ONE",
      translation: { text: "Translation one" },
      audio: { url: "https://audio.example/alafasy/1.mp3" },
    },
    {
      number: 2,
      numberInSurah: 2,
      text: "AYAH_TWO",
      translation: { text: "Translation two" },
      audio: { url: "https://audio.example/alafasy/2.mp3" },
    },
  ],
};

function ReciterSwitcher() {
  const { setAudioEdition } = usePreferences();

  return (
    <button
      type="button"
      onClick={() => setAudioEdition("ar.abdulbasitmurattal")}
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
    getEditions.mockResolvedValue([]);
    getBookmarks.mockResolvedValue([]);
    getSurah.mockResolvedValue(surahData);
    getSurahAudio.mockImplementation(async (number, edition) => ({
      number,
      edition: {
        identifier: edition,
        englishName:
          edition === "ar.alafasy" ? "Alafasy" : "Abdul Basit",
      },
      ayahs: surahData.ayahs.map((ayah) => ({
        numberInSurah: ayah.numberInSurah,
        audio: {
          url: `https://audio.example/${edition}/${ayah.numberInSurah}.mp3`,
          secondary: [],
        },
      })),
    }));

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

  it("only selects an Ayah when its text is clicked, then loads and pauses through its translation control", async () => {
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
    expect(audio.src).toBe("https://audio.example/alafasy/1.mp3");

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

  it("keeps the active Ayah playing through a reciter change without reloading Surah text", async () => {
    const { container } = renderReader();
    await screen.findByText("AYAH_ONE");
    await act(async () => fireEvent.click(screen.getAllByText("AYAH_ONE")[0]));
    fireEvent.click(screen.getByRole("button", { name: "Play verse 1" }));
    await screen.findByRole("button", { name: "Pause verse audio" });

    fireEvent.click(screen.getByRole("button", { name: "Change reciter" }));

    await waitFor(() => {
      expect(container.querySelector("audio").src).toBe(
        "https://audio.example/ar.abdulbasitmurattal/1.mp3",
      );
    });
    await waitFor(() => expect(audioPlay).toHaveBeenCalledTimes(2));
    expect(getSurah).toHaveBeenCalledTimes(1);
  });

  it("keeps a paused Ayah paused when the reciter changes", async () => {
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
      expect(container.querySelector("audio").src).toBe(
        "https://audio.example/ar.abdulbasitmurattal/1.mp3",
      );
    });
    expect(audioPlay).toHaveBeenCalledTimes(1);
    await act(async () => {
      container.querySelector("audio").dispatchEvent(new Event("canplay"));
    });
    expect(
      screen.getByRole("button", { name: "Play verse 1" }),
    ).toBeTruthy();
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
      "https://audio.example/alafasy/1.mp3",
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
