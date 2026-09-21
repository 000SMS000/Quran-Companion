import { AlertCircle } from 'lucide-react';

function ErrorState({ title = 'Something went wrong', message, action }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          {message && <p className="mt-2 text-sm leading-6 opacity-90">{message}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
