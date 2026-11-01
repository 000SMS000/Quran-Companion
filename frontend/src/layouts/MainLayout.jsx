import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AudioPlayer from '../components/AudioPlayer';

function MainLayout({ theme }) {
  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-stone-50 pb-28 text-slate-950 dark:bg-slate-950 dark:text-white"
    >
      <Navbar />
      <Outlet />
      <AudioPlayer />
    </div>
  );
}

export default MainLayout;
