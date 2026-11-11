'use client';
import { useState } from 'react';
import {
  useGetAdminProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateCategoryMutation,
} from '@/redux/features/apiSlice';
import ProductForm from '@/components/admin/ProductForm';
import { notify, getErrorMessage } from '@/lib/toast';

const STATUS = {
  active:     'bg-emerald-50 text-emerald-700',
  inactive:   'bg-slate-100 text-slate-600',
  outofstock: 'bg-rose-50 text-rose-700',
};
const bdt = (p) => `৳${((p || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

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

export default function AdminProductsPage() {
  const [sheet, setSheet] = useState(null); // { mode: 'create' } | { mode: 'edit', product }
  const [deleting, setDeleting] = useState(null);
  const [newCategory, setNewCategory] = useState('');

  const { data, isLoading } = useGetAdminProductsQuery();
  const { data: catData } = useGetCategoriesQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: removing }] = useDeleteProductMutation();
  const [createCategory, { isLoading: addingCat }] = useCreateCategoryMutation();

  const products = data?.data || [];
  const categories = catData?.data || [];

  async function handleSubmit({ data, file }) {
    
    try {
      if (sheet.mode === 'create') await createProduct({ data, file }).unwrap();
      else await updateProduct({ id: sheet.product._id, ...data }).unwrap();
      notify.success(sheet.mode === 'create' ? 'Product created successfully.' : 'Product updated successfully.');
      setSheet(null);
    } catch (e) {
      const first = e?.data?.errorSources?.[0];
      notify.error(first?.path ? `${first.path}: ${first.message}` : getErrorMessage(e, 'Something went wrong.'));
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (newCategory.trim().length < 2) return;
    try {
      await createCategory({ name: newCategory.trim() }).unwrap();
      notify.success('Category added.');
      setNewCategory('');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not create category.'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Upload products and manage stock, rewards and limits.</p>
        </div>
        <button onClick={() => {  setSheet({ mode: 'create' }); }}
          className="bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-bold">+ Add product</button>
      </div>

      {/* Quick category add */}
      <form onSubmit={handleAddCategory} className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <p className="text-xs font-extrabold text-slate-500 shrink-0">
          CATEGORIES: {categories.length ? categories.map((c) => c.name).join(', ') : 'none yet'}
        </p>
        <div className="flex gap-2 sm:ml-auto">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name"
            className="rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 w-full sm:w-56" />
          <button disabled={addingCat} className="border rounded-xl px-4 text-xs font-bold whitespace-nowrap">Add</button>
        </div>
      </form>

      {isLoading && <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />}
      {!isLoading && products.length === 0 && (
        <p className="bg-white border rounded-2xl text-center text-sm text-slate-400 py-12">No products yet. Add your first one.</p>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((p) => (
          <article key={p._id} className="bg-white border rounded-2xl overflow-hidden flex flex-col">
            <div className="aspect-[16/9] bg-slate-100 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
              <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS[p.status]}`}>{p.status}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-extrabold truncate">{p.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{p.category?.name || ''}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                <div><dt className="text-[11px] text-slate-400">Price</dt><dd className="font-bold">{bdt(p.price)}</dd></div>
                <div><dt className="text-[11px] text-slate-400">Daily earning</dt><dd className="font-bold">{bdt(p.rewardPlan?.dailyIncome)}</dd></div>
                <div><dt className="text-[11px] text-slate-400">Validity</dt><dd className="font-bold">{p.rewardPlan?.validityDays} days</dd></div>
                <div><dt className="text-[11px] text-slate-400">Stock</dt>
                  <dd className={`font-bold ${p.quantity === 0 ? 'text-rose-600' : ''}`}>{p.quantity ?? '—'}</dd></div>
                <div><dt className="text-[11px] text-slate-400">Sold</dt><dd className="font-bold">{p.purchaseCount}</dd></div>
                <div><dt className="text-[11px] text-slate-400">Limit / user</dt><dd className="font-bold">{p.purchaseRules?.purchaseLimit}</dd></div>
              </dl>
              <div className="flex gap-2 mt-5 pt-4 border-t">
                <button onClick={() => {  setSheet({ mode: 'edit', product: p }); }}
                  className="flex-1 border rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50">Edit</button>
                <button onClick={() => setDeleting(p)}
                  className="flex-1 rounded-xl py-2.5 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100">Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {sheet && (
        <Sheet title={sheet.mode === 'create' ? 'Add product' : `Edit: ${sheet.product.name}`} onClose={() => setSheet(null)}>
          <ProductForm
            mode={sheet.mode}
            product={sheet.product}
            categories={categories}
            submitting={creating || updating}
            onSubmit={handleSubmit}
            onCancel={() => setSheet(null)}
          />
        </Sheet>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-extrabold text-lg mb-2">Delete product?</h3>
            <p className="text-sm text-slate-600 mb-5">&ldquo;{deleting.name}&rdquo; will be hidden. Existing purchases are not affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 border rounded-xl py-3 text-sm font-bold">Cancel</button>
              <button disabled={removing}
                onClick={async () => {
                  try {
                    await deleteProduct(deleting._id).unwrap();
                    notify.success('Product deleted.');
                  } catch (err) {
                    notify.error(getErrorMessage(err, 'Could not delete this product.'));
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
