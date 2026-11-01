import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SurahReaderPage from './pages/SurahReaderPage';
import SurahsPage from './pages/SurahsPage';
import BookmarksPage from "./pages/BookmarksPage";
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { theme } = usePreferences();

  return (
    <BrowserRouter>
      <AudioPlayerProvider>
        <Routes>
          <Route element={<MainLayout theme={theme} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/surahs" element={<SurahsPage />} />
            <Route path="/surah/:number" element={<SurahReaderPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
          </Route>
        </Routes>
      </AudioPlayerProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <PreferencesProvider>
      <AppRoutes />
    </PreferencesProvider>
  );
}

export default App;
