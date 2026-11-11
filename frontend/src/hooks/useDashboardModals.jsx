'use client';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { usePurchaseProductMutation } from '@/redux/features/apiSlice';
import { getErrorMessage } from '@/lib/toast';

// useProductModal — opens a real product detail modal with purchase action
export function useProductModal() {
  const router = useRouter();
  const { openModal, closeModal, showToast } = useDashboard();
  const [purchaseProduct, { isLoading: purchasing }] = usePurchaseProductMutation();

  function openProduct(product) {
    if (!product) return;
    openModal('PRODUCT DETAILS', product.name, (
      <div>
        <div className="h-32 rounded-2xl bg-gradient-to-br from-lime-100 to-harvest-200 grid place-items-center text-6xl mb-4">
          {product.image
            ? <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-2xl" />
            : '🌿'}
        </div>
        <span className="bg-harvest-50 text-harvest-700 px-3 py-1.5 rounded-lg text-xs font-bold">
          {product.categoryId?.name || product.category || 'General'}
        </span>
        <p className="text-sm leading-6 text-slate-600 mt-4">{product.description || 'Review the product terms, eligibility and risks before deciding to participate.'}</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="border rounded-xl p-3"><small className="text-xs text-slate-500">Price</small><b className="block text-lg mt-1">৳{product.price?.toLocaleString()}</b></div>
          <div className="border rounded-xl p-3"><small className="text-xs text-slate-500">Daily income</small><b className="block text-lg mt-1">৳{product.dailyIncome || '—'}</b></div>
          <div className="border rounded-xl p-3"><small className="text-xs text-slate-500">Validity</small><b className="block mt-1">{product.validityDays || '—'} days</b></div>
          <div className="border rounded-xl p-3"><small className="text-xs text-slate-500">Total return</small><b className="block mt-1">৳{product.totalReturn || '—'}</b></div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
          <b className="text-sm">⚠ Important notice</b>
          <p className="text-xs leading-5 mt-1">Returns are not guaranteed. Review all terms before participating.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <button onClick={() => { closeModal(); router.push('/dashboard/recharge'); }} className="border rounded-xl py-3 text-sm font-bold">＋ Recharge wallet</button>
          <button
            disabled={purchasing}
            onClick={async () => {
              try {
                await purchaseProduct({ productId: product._id }).unwrap();
                closeModal();
                showToast('Product purchased successfully!');
                router.push('/dashboard/purchased');
              } catch (err) {
                showToast(getErrorMessage(err, 'Purchase failed. Check your wallet balance.'), 'error');
              }
            }}
            className="bg-harvest-700 text-white rounded-xl py-3 text-sm font-extrabold disabled:opacity-60"
          >
            {purchasing ? 'Processing…' : 'Purchase now →'}
          </button>
        </div>
      </div>
    ));
  }

  return openProduct;
}

// useTaskModal — opens a real task detail modal
export function useTaskModal() {
  const { openModal, closeModal, showToast } = useDashboard();

  function openTask(task) {
    if (!task) return;
    openModal('TASK BONUS', task.title, (
      <div>
        <div className="h-28 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-200 grid place-items-center text-6xl mb-4">
          {task.icon || '✧'}
        </div>
        <p className="text-sm text-slate-600 leading-6">{task.description}</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="border rounded-xl p-3"><small className="text-xs text-slate-500">Task reward</small><b className="block text-xl text-harvest-700 mt-1">৳{task.rewardAmount}</b></div>
          <div className="border rounded-xl p-3"><small className="text-xs text-slate-500">Status</small><b className="block mt-2 capitalize">{task.status || 'Available'}</b></div>
        </div>
        {task.instructions && (
          <>
            <b className="block text-sm mt-5">How to claim</b>
            <p className="text-sm text-slate-500 leading-6 mt-1">{task.instructions}</p>
          </>
        )}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
          <b className="text-sm">Special note</b>
          <p className="text-xs leading-5 mt-1">Rewards are subject to eligibility and review. Never share private account information.</p>
        </div>
        <button
          onClick={() => { closeModal(); showToast('Task submitted for review.'); }}
          className="mt-5 w-full bg-harvest-700 text-white rounded-xl py-3 font-bold"
        >
          Submit task for review →
        </button>
      </div>
    ));
  }

  return openTask;
}
