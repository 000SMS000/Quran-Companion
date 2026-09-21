import { Link, NavLink } from 'react-router-dom';
import { BookOpen, Moon, Search, Sun } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/surahs', label: 'Quran' },
  { to: '/search', label: 'Search' },
];

function Navbar({ theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-stone-50/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-slate-950 dark:text-white">
          <span className="rounded-md bg-emerald-700 p-2 text-white">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="font-semibold">Quran Companion</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <NavLink
            to="/search"
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </NavLink>

          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
