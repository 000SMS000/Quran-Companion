import { Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

function LoadingState({ label }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-700 dark:text-emerald-300" />
        <span>{label ?? t('common.loading')}</span>
      </div>
    </div>
  );
}

export default LoadingState;
