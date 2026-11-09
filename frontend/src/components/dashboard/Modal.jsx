'use client';

// Modal — reusable popup used for product details, task details, purchase flow
// Props:
//   open      — boolean, whether modal is visible
//   tag       — small label text at top (e.g. "PRODUCT DETAILS")
//   title     — main modal heading
//   onClose   — function to close the modal
//   children  — modal body content

export default function Modal({ open, tag, title, onClose, children }) {
  if (!open) return null;

  return (
    // Full screen overlay — dark semi-transparent background
    <div
      className="fixed inset-0 z-50 modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={onClose} // clicking outside closes modal
    >
      {/* Modal box — stop click from bubbling to overlay */}
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header inside modal */}
        <div className="sticky top-0 bg-white/95 border-b px-5 py-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-extrabold tracking-widest text-harvest-700">{tag}</p>
            <h2 className="font-extrabold text-lg mt-1">{title}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl border text-xl">×</button>
        </div>

        {/* Modal body content */}
        <div className="p-5 sm:p-7">{children}</div>
      </div>
    </div>
  );
}
