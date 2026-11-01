import { Link, NavLink } from "react-router-dom";
import { BookOpen, Bookmark, House, Search, Settings } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const navItems = [
  { to: "/", label: "nav.home", icon: House },
  { to: "/surahs", label: "nav.quran", icon: BookOpen },
  { to: "/search", label: "nav.search", icon: Search },
  { to: "/bookmarks", label: "nav.bookmarks", icon: Bookmark },
  { to: "/settings", label: "nav.settings", icon: Settings },
];

function Navbar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-stone-50/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
      <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-3 text-slate-950 dark:text-white"
          >
            <span className="rounded-md bg-emerald-700 p-2 text-white">
              <BookOpen className="h-5 w-5" />
            </span>

            <span className="font-semibold">Quran Companion</span>
          </Link>
        </div>

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
              {t(item.label)}
            </NavLink>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1 sm:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                aria-label={t(item.label)}
                className={({ isActive }) =>
                  `flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition ${
                    isActive
                      ? "bg-emerald-700 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(item.label)}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
