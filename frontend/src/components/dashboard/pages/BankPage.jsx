'use client';
import { useState } from 'react';

// Bank page — user saves one bKash or Nagad number for withdrawals
// Props:
//   savedBank    — current saved bank { method, holder, number } or null
//   setSavedBank — function to update saved bank in parent state
//   showToast    — show notification

export default function BankPage({ savedBank, setSavedBank, showToast }) {
  const [editing, setEditing]   = useState(false);
  const [bankMethod, setBankMethod] = useState('bKash');
  const [holder, setHolder]     = useState('');
  const [number, setNumber]     = useState('');
  const [otp, setOtp]           = useState('');

  // When editing, pre-fill form with saved values
  function startEdit() {
    setEditing(true);
    setBankMethod(savedBank.method);
    setHolder(savedBank.holder);
    setNumber(savedBank.number);
  }

  function handleSave() {
    if (!holder.trim())                          return showToast('Enter the account holder name.');
    if (!/^01\d{9}$/.test(number.replace(/[\s-]/g, ''))) return showToast('Enter a valid 11-digit mobile wallet number.');
    if (editing && otp.trim().length < 4)        return showToast('Enter the verification code to edit saved details.');

    setSavedBank({ method: bankMethod, holder: holder.trim(), number: number.replace(/[\s-]/g, '') });
    setEditing(false);
    setOtp('');
    showToast('Payout details saved in this session.');
  }

  const showForm = !savedBank || editing;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Payout details</h1>
        <p className="text-sm text-slate-500 mt-1">Save one bKash or Nagad mobile wallet for withdrawals.</p>
      </div>

      <div className="max-w-4xl grid md:grid-cols-[.8fr_1.2fr] gap-5">
        {/* Left: saved method display */}
        <div className="bg-white border rounded-2xl p-5">
          <div className="w-12 h-12 rounded-2xl bg-harvest-50 grid place-items-center text-2xl">🛡️</div>
          <h2 className="font-extrabold text-lg mt-4">Saved payout method</h2>
          <p className="text-sm text-slate-500 leading-6 mt-2">Only one mobile wallet can be saved at a time. Editing requires verification.</p>

          {savedBank && !editing ? (
            // Show saved card
            <div className="mt-5 rounded-xl bg-slate-50 border p-4">
              <span className="text-xs font-bold text-emerald-700">SAVED</span>
              <b className="block mt-2">{savedBank.method} · {savedBank.holder}</b>
              <span className="text-sm text-slate-500">{savedBank.number}</span>
              <button onClick={startEdit} className="mt-4 w-full border bg-white rounded-xl py-3 text-sm font-bold">Edit details · Verify first</button>
            </div>
          ) : (
            // Show empty state
            <div className="mt-5 rounded-xl border border-dashed p-5 text-center">
              <span className="text-3xl">＋</span>
              <p className="font-bold mt-2">No payout method added</p>
              <p className="text-xs text-slate-500 mt-1">Add one mobile wallet.</p>
            </div>
          )}
        </div>

        {/* Right: add/edit form */}
        <div className="bg-white border rounded-2xl p-5 sm:p-6">
          <h2 className="font-extrabold text-lg">{editing ? 'Verify to edit payout details' : savedBank ? 'Payout method saved' : 'Add payout method'}</h2>
          <p className="text-xs text-slate-500 mt-1">bKash or Nagad only.</p>

          {/* Method selector — hidden when saved and not editing */}
          {showForm && (
            <div className="grid grid-cols-2 gap-3 mt-5">
              {['bKash', 'Nagad'].map(m => (
                <button
                  key={m}
                  onClick={() => setBankMethod(m)}
                  className={`border-2 rounded-xl p-3 text-left ${bankMethod === m ? 'border-harvest-600 bg-harvest-50' : 'border-slate-200'}`}
                >
                  <b>{m}</b>
                  <small className="block text-xs text-slate-500 mt-1">Mobile wallet</small>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-bold mb-2">Account holder name</label>
            <input
              value={holder}
              onChange={e => setHolder(e.target.value)}
              disabled={!!savedBank && !editing}
              placeholder="Registered account holder"
              className="w-full rounded-xl border px-3.5 py-3 text-sm disabled:bg-slate-50"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-bold mb-2">Mobile wallet number</label>
            <input
              value={number}
              onChange={e => setNumber(e.target.value)}
              disabled={!!savedBank && !editing}
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
              className="w-full rounded-xl border px-3.5 py-3 text-sm disabled:bg-slate-50"
            />
          </div>

          {/* OTP field — only shown when editing */}
          {editing && (
            <div className="mt-4">
              <label className="block text-sm font-bold mb-2">Verification code</label>
              <div className="flex gap-2">
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" className="min-w-0 flex-1 rounded-xl border px-3 py-3 text-sm" />
                <button onClick={() => showToast('Connect OTP delivery in your backend.')} className="border rounded-xl px-3 text-xs font-bold">Send code</button>
              </div>
            </div>
          )}

          {/* Save button — hidden when saved and not editing */}
          {showForm && (
            <button onClick={handleSave} className="mt-5 w-full rounded-xl bg-harvest-700 text-white py-4 text-sm font-extrabold">
              {editing ? 'Verify & save changes' : 'Save payout details'}
            </button>
          )}

          <p className="text-xs text-slate-500 leading-5 mt-3">Never share your wallet PIN or OTP with anyone.</p>
        </div>
      </div>
    </div>
  );
}


