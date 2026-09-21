import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SurahReaderPage from './pages/SurahReaderPage';
import SurahsPage from './pages/SurahsPage';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <AudioPlayerProvider>
        <Routes>
          <Route
            element={
              <MainLayout
                theme={theme}
                onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              />
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/surahs" element={<SurahsPage />} />
            <Route path="/surah/:number" element={<SurahReaderPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AudioPlayerProvider>
    </BrowserRouter>
  );
}

export default App;
