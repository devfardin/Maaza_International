// Inline loading indicator for page sections and route transitions.
export default function PageLoader({ label = 'Loading…', className = '' }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500 ${className}`}>
      <span className="h-9 w-9 rounded-full border-4 border-harvest-100 border-t-harvest-600 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
