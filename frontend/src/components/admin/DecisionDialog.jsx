'use client';
// Confirm dialog for approve / reject actions (deposits and withdrawals).
import { useState } from 'react';

export default function DecisionDialog({
  open,
  action,            // 'approved' | 'rejected'
  title,
  description,
  busy = false,
  showReference = false,   // ask for a payout reference (withdrawal approval)
  onCancel,
  onConfirm,         // ({ adminNote, payoutReference }) => void
}) {
  // Parent passes a `key` per request, so this state resets each time a dialog opens
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');

  if (!open) return null;

  const approving = action === 'approved';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 className="font-extrabold text-lg">{title}</h3>
        <p className="text-sm text-slate-600 mt-2">{description}</p>

        {showReference && approving && (
          <div className="mt-4">
            <label htmlFor="payout-ref" className="block text-xs font-bold text-slate-600 mb-1">Payout reference (bKash/Nagad trx ID)</label>
            <input id="payout-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Optional" />
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="admin-note" className="block text-xs font-bold text-slate-600 mb-1">Note to user {approving ? '(optional)' : '(shown in the email)'}</label>
          <textarea id="admin-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Admin note" />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={onCancel} disabled={busy} className="border rounded-xl py-3 text-sm font-bold">Cancel</button>
          <button
            onClick={() => onConfirm({ adminNote: note.trim() || undefined, payoutReference: reference.trim() || undefined })}
            disabled={busy}
            className={`rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 ${approving ? 'bg-emerald-600' : 'bg-rose-600'}`}
          >
            {busy ? 'Saving…' : approving ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
