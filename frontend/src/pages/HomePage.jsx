import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Headphones, Search } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

function HomePage() {
  const { t } = useTranslation();
  const features = [
    { icon: BookOpen, title: 'home.browseTitle', text: 'home.browseDescription' },
    { icon: Headphones, title: 'home.listenTitle', text: 'home.listenDescription' },
    { icon: Search, title: 'home.searchTitle', text: 'home.searchDescription' },
  ];

  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            Quran Companion
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-slate-950 dark:text-white">
            {t('home.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {t('home.description')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/surahs"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-emerald-800"
            >
              {t('home.openQuran')} <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {t('home.searchVerses')}
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="quran-arabic text-end text-5xl leading-[2.1] text-emerald-950 dark:text-emerald-100" dir="rtl">
            ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ
          </p>
          <p className="mt-6 text-slate-600 dark:text-slate-300">
            {t('home.reflection')}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {features.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <item.icon className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
            <h2 className="mt-4 font-semibold text-slate-950 dark:text-white">{t(item.title)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t(item.text)}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

export default HomePage;
