'use client';
// Super-admin only: manage the deposit payment methods shown on the member recharge page.
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetAdminPaymentMethodsQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useTogglePaymentMethodStatusMutation,
  useDeletePaymentMethodMutation,
} from '@/redux/features/apiSlice';
import PaymentMethodForm from '@/components/admin/PaymentMethodForm';
import SafeHtml from '@/components/shared/SafeHtml';
import PageLoader from '@/components/shared/PageLoader';
import { notify, getErrorMessage } from '@/lib/toast';

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-lg">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl border grid place-items-center">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PaymentMethodsAdminPage() {
  const role = useSelector((s) => s.auth.user?.role);
  const [sheet, setSheet] = useState(null); // { mode: 'create' } | { mode: 'edit', method }
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useGetAdminPaymentMethodsQuery(undefined, { skip: role !== 'super_admin' });
  const [createMethod, { isLoading: creating }] = useCreatePaymentMethodMutation();
  const [updateMethod, { isLoading: updating }] = useUpdatePaymentMethodMutation();
  const [toggleMethod] = useTogglePaymentMethodStatusMutation();
  const [deleteMethod, { isLoading: removing }] = useDeletePaymentMethodMutation();

  if (role && role !== 'super_admin') {
    return (
      <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-500">
        Only the super admin can manage payment methods.
      </div>
    );
  }

  const methods = data?.data || [];

  async function handleSubmit({ data: body, file }) {
    try {
      if (sheet.mode === 'create') await createMethod({ data: body, file }).unwrap();
      else await updateMethod({ id: sheet.method._id, data: body, file }).unwrap();
      notify.success(sheet.mode === 'create' ? 'Payment method created.' : 'Payment method updated.');
      setSheet(null);
    } catch (err) {
      const first = err?.data?.errorSources?.[0];
      notify.error(first?.path ? `${first.path}: ${first.message}` : getErrorMessage(err, 'Could not save payment method.'));
    }
  }

  async function handleToggle(m) {
    try {
      await toggleMethod(m._id).unwrap();
      notify.success(`${m.name} is now ${m.isActive ? 'hidden' : 'active'}.`);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not change status.'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Payment methods</h1>
          <p className="text-sm text-slate-500 mt-1">Methods members can pay deposits with. Only active methods are shown on the recharge page.</p>
        </div>
        <button onClick={() => setSheet({ mode: 'create' })} className="bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-bold">+ Add method</button>
      </div>

      {isLoading ? (
        <PageLoader label="Loading payment methods…" />
      ) : methods.length === 0 ? (
        <p className="bg-white border rounded-2xl text-center text-sm text-slate-400 py-12">No payment methods yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {methods.map((m) => (
            <article key={m._id} className="bg-white border rounded-2xl overflow-hidden flex flex-col">
              <div className="h-36 bg-slate-100 grid place-items-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.image ? <img src={m.image} alt={m.name} className="w-full h-full object-contain p-3" loading="lazy" /> : <span className="text-xs text-slate-400">No image</span>}
                <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${m.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {m.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-extrabold truncate">{m.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{m.accountType} · <span className="font-mono">{m.accountNumber}</span></p>
                <div className="mt-3 text-xs text-slate-600 line-clamp-3">
                  <SafeHtml html={m.instructions} />
                </div>
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t">
                  <button onClick={() => handleToggle(m)} className="flex-1 border rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50">
                    {m.isActive ? 'Hide' : 'Activate'}
                  </button>
                  <button onClick={() => setSheet({ mode: 'edit', method: m })} className="flex-1 border rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50">Edit</button>
                  <button onClick={() => setDeleting(m)} className="flex-1 rounded-xl py-2.5 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {sheet && (
        <Sheet title={sheet.mode === 'create' ? 'Add payment method' : `Edit: ${sheet.method.name}`} onClose={() => setSheet(null)}>
          <PaymentMethodForm
            key={sheet.method?._id ?? 'new'}
            method={sheet.method}
            submitting={creating || updating}
            onSubmit={handleSubmit}
            onCancel={() => setSheet(null)}
          />
        </Sheet>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-extrabold text-lg mb-2">Delete payment method?</h3>
            <p className="text-sm text-slate-600 mb-5">&ldquo;{deleting.name}&rdquo; will be removed. Existing deposit requests are not affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 border rounded-xl py-3 text-sm font-bold">Cancel</button>
              <button disabled={removing}
                onClick={async () => {
                  try {
                    await deleteMethod(deleting._id).unwrap();
                    notify.success('Payment method deleted.');
                  } catch (err) {
                    notify.error(getErrorMessage(err, 'Could not delete this payment method.'));
                  } finally {
                    setDeleting(null);
                  }
                }}
                className="flex-1 bg-rose-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
