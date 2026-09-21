import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Headphones, Search } from 'lucide-react';

function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            Quran Companion
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-slate-950 dark:text-white">
            Read, listen, and search the Quran through a calm focused interface.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Browse all 114 Surahs, view Arabic text with translation, and play ayah-by-ayah
            recitation through the Laravel API integration.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/surahs"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-emerald-800"
            >
              Open Quran <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Search verses
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="quran-arabic text-right text-5xl leading-[2.1] text-emerald-950 dark:text-emerald-100" dir="rtl">
            ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ
          </p>
          <p className="mt-6 text-slate-600 dark:text-slate-300">
            Begin with Surah Al-Fatiha or search for a word like patience, mercy, or prayer.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          { icon: BookOpen, title: 'Browse Surahs', text: 'Responsive cards for all Surahs.' },
          { icon: Headphones, title: 'Listen', text: 'Persistent ayah audio player.' },
          { icon: Search, title: 'Search', text: 'Search via Laravel and Al Quran Cloud.' },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <item.icon className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            <h2 className="mt-4 font-semibold text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

export default HomePage;
