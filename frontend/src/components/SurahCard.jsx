import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTranslation } from '../hooks/useTranslation';

function SurahCard({ surah }) {
  const { language } = usePreferences();
  const { t } = useTranslation();
  const revelationKey =
    surah.revelationType?.toLowerCase() === 'medinan'
      ? 'surahs.revelation.medinan'
      : 'surahs.revelation.meccan';

  return (
    <Link
      to={`/surah/${surah.number}`}
      aria-label={`${language === 'ar' ? surah.name : surah.englishName}, ${t(
        'surahs.ayahCount',
        { count: surah.numberOfAyahs },
      )}`}
      className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-emerald-50 text-sm font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
            {surah.number}
          </span>
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">
              {language === 'ar' ? surah.name : surah.englishName}
            </h2>
            {language === 'en' && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {surah.englishNameTranslation}
              </p>
            )}
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-emerald-700 dark:text-slate-600 dark:group-hover:text-emerald-300" />
      </div>

      <p className="quran-arabic mt-5 text-end text-3xl text-slate-900 dark:text-white" dir="rtl">
        {surah.name}
      </p>

      <div className="mt-5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{t('surahs.ayahCount', { count: surah.numberOfAyahs })}</span>
        <span>{t(revelationKey)}</span>
      </div>
    </Link>
  );
}

export default SurahCard;
