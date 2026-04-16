import { Info } from 'lucide-react';

interface MockupDataProps {
  message?: string;
}

export function MockupData({ message }: MockupDataProps) {
  return (
    <div className="mb-6 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-slate-700">
      <div className="flex items-center gap-2 pb-2 text-slate-900">
        <Info className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-semibold">Today is using mockup data</span>
      </div>
      <p>
        {message ??
          'Since Today has no live data yet, the dashboard is showing generated mock metrics for a realistic preview.'}
      </p>
    </div>
  );
}
