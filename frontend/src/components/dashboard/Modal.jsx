'use client';

// Modal — reusable popup. On phones it slides up as a full-width sheet.
// Props:
//   open, tag, title, onClose, children
export default function Modal({ open, tag, title, onClose, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b px-5 py-4 flex justify-between items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-widest text-harvest-700">{tag}</p>
            <h2 className="font-extrabold text-lg mt-1 break-words">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 shrink-0 rounded-xl border text-xl">×</button>
        </div>
        <div className="p-5 sm:p-7 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
