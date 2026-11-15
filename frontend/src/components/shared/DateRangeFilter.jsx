'use client';
// Two date inputs (from / to) for filtering a list by date. Empty = no limit.
export default function DateRangeFilter({ from, to, onChange }) {
  const field = 'rounded-xl border bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500';
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">From</span>
        <input type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">To</span>
        <input type="date" value={to} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} className={field} />
      </label>
      {(from || to) && (
        <button type="button" onClick={() => onChange({ from: '', to: '' })} className="rounded-xl border px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
          Clear dates
        </button>
      )}
    </div>
  );
}
