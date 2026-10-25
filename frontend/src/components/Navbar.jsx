import { Link, NavLink } from "react-router-dom";
import { BookOpen, Bookmark, House, Moon, Search, Sun } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/surahs", label: "Quran", icon: BookOpen },
  { to: "/search", label: "Search", icon: Search },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

function Navbar({ theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-stone-50/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
      <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-8">
        {/* Logo and theme toggle */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-3 text-slate-950 dark:text-white"
          >
            <span className="rounded-md bg-emerald-700 p-2 text-white">
              <BookOpen className="h-5 w-5" />
            </span>

            <span className="font-semibold">Quran Companion</span>
          </Link>

          <button
            type="button"
            onClick={onToggleTheme}
            className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile navigation */}
        <div className="grid grid-cols-4 gap-1 sm:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                aria-label={item.label}
                className={({ isActive }) =>
                  `flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
