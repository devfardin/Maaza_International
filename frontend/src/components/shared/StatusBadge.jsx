// Colour-coded status pill used for deposits, withdrawals, purchases.
const STYLES = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:  'bg-rose-50 text-rose-700 border-rose-200',
  completed: 'bg-sky-50 text-sky-700 border-sky-200',
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function StatusBadge({ status }) {
  const s = status || 'pending';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize whitespace-nowrap ${STYLES[s] || STYLES.pending}`}>
      {s}
    </span>
  );
}
