// Inline loader for page sections. A slim brand-green ring with a quiet caption.
export default function PageLoader({ label = 'Loading…', className = '' }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-4 py-16 ${className}`}>
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-full border-[3px] border-harvest-100" />
        <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-harvest-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
