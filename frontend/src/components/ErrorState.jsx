import { AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

function ErrorState({ title, message, action }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="font-semibold">{title ?? t('common.errorTitle')}</h2>
          <p className="mt-2 text-sm leading-6 opacity-90">
            {message ?? t('common.errorMessage')}
          </p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
