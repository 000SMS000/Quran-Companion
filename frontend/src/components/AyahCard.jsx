import { Bookmark, Check, Copy, Play } from 'lucide-react';
import { useState } from 'react';

function AyahCard({ ayah, surahName, translationEdition, onPlay, isCurrent }) {
  const [copied, setCopied] = useState(false);
  const [marked, setMarked] = useState(false);

  async function copyAyah() {
    const translation = ayah.translation?.text ? `\n\n${ayah.translation.text}` : '';
    await navigator.clipboard.writeText(`${ayah.text}${translation}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm transition dark:bg-white/5 ${
        isCurrent
          ? 'border-emerald-600 ring-2 ring-emerald-600/10 dark:border-emerald-300'
          : 'border-slate-200 dark:border-white/10'
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="rounded-md bg-stone-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {surahName} · Ayah {ayah.numberInSurah}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyAyah}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-emerald-300"
            aria-label="Copy ayah"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onPlay}
            disabled={!ayah.audio?.url}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-emerald-300"
            aria-label="Play ayah audio"
          >
            <Play className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMarked((value) => !value)}
            className={`rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-white/10 ${
              marked ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'
            }`}
            aria-label="Bookmark placeholder"
            title="Bookmark persistence will be added in a later phase"
          >
            <Bookmark className="h-5 w-5" fill={marked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <p
        className="quran-arabic text-right text-3xl leading-[2.35] text-slate-950 dark:text-white sm:text-4xl"
        dir="rtl"
      >
        {ayah.text}
      </p>

      {ayah.translation?.text && (
        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/10">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {translationEdition?.englishName ?? 'Translation'}
          </p>
          <p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">
            {ayah.translation.text}
          </p>
        </div>
      )}
    </article>
  );
}

export default AyahCard;
