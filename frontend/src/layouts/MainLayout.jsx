import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AudioPlayer from '../components/AudioPlayer';

function MainLayout({ theme, onToggleTheme }) {
  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-slate-950 dark:bg-slate-950 dark:text-white">
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
      <Outlet />
      <AudioPlayer />
    </div>
  );
}

export default MainLayout;
