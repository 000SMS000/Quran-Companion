import { useState } from "react";
import { Bookmark, Check, Copy, Play } from "lucide-react";

function AyahCard({ ayah, onPlay, showTranslation = false }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const translationVisible = showTranslation || expanded;

  const handleCopy = async () => {
    try {
      const translationText = ayah.translation?.text
        ? `\n\n${ayah.translation.text}`
        : "";

      await navigator.clipboard.writeText(`${ayah.text}${translationText}`);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy ayah:", error);
    }
  };

  const handleBookmark = () => {
    setBookmarked((current) => !current);
  };

  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm transition dark:bg-white/5 ${
        expanded
          ? 'border-emerald-600 ring-2 ring-emerald-600/10 dark:border-emerald-300'
          : 'border-slate-200 dark:border-white/10'
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onPlay?.(ayah)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title="تشغيل الآية"
          aria-label="تشغيل الآية"
        >
          <Play size={16} fill="currentColor" />
        </button>

        <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-zinc-100 px-2 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {ayah.numberInSurah}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="block w-full text-right"
        aria-expanded={translationVisible}
      >
        <p
          dir="rtl"
          lang="ar"
          className="font-quran text-3xl leading-[2.2] text-zinc-900 dark:text-zinc-100"
        >
          {ayah.text}
          <p
            dir="rtl"
            lang="ar"
            className="font-quran text-3xl leading-[2.2] text-zinc-900 dark:text-zinc-100"
          >
          </p>
        </p>

        {!translationVisible && ayah.translation?.text && (
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            اضغط على الآية لعرض الترجمة
          </p>
        )}
      </button>

      {translationVisible && ayah.translation?.text && (
        <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p
            dir="ltr"
            className="text-base leading-8 text-zinc-600 dark:text-zinc-300"
          >
            {ayah.translation.text}
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "تم النسخ" : "نسخ"}
        </button>

        <button
          type="button"
          onClick={handleBookmark}
          className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition ${
            bookmarked
              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          }`}
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
          {bookmarked ? "محفوظة" : "حفظ"}
        </button>
      </div>
    </article>
  );
}

export default AyahCard;
