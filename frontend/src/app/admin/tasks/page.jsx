'use client';
// Admin tasks: create a task (image, reward, instructions, dates) and see the current list.
import { useState } from 'react';
import { useGetTasksQuery, useCreateTaskMutation } from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import MediaField from '@/components/shared/MediaField';

const EMPTY = {
  title: '', description: '', instructions: '', specialNote: '',
  rewardAmount: '', rewardType: 'cash', startsAt: '', endsAt: '',
};
const field = 'w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500';

export default function AdminTasksPage() {
  const { data, isLoading } = useGetTasksQuery();
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState('');

  const tasks = data?.data || [];
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!image) return notify.error('Please choose a task image.');
    if (new Date(form.endsAt) <= new Date(form.startsAt)) return notify.error('The end date must be after the start date.');
    try {
      await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        instructions: form.instructions.trim(),
        specialNote: form.specialNote.trim(),
        image,
        rewardAmount: Number(form.rewardAmount), // BDT
        rewardType: form.rewardType,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }).unwrap();
      notify.success('Task created.');
      setForm(EMPTY);
      setImage('');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not create the task.'));
    }
  }

  const busy = creating;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">Create promotional tasks that members can complete for a reward.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2"><span className="block text-xs font-bold text-slate-600 mb-1">Title</span>
          <input required value={form.title} onChange={set('title')} className={field} /></label>
        <label className="sm:col-span-2"><span className="block text-xs font-bold text-slate-600 mb-1">Description</span>
          <textarea required rows={3} value={form.description} onChange={set('description')} className={field} /></label>
        <label className="sm:col-span-2"><span className="block text-xs font-bold text-slate-600 mb-1">Instructions</span>
          <textarea required rows={3} value={form.instructions} onChange={set('instructions')} className={field} /></label>
        <label className="sm:col-span-2"><span className="block text-xs font-bold text-slate-600 mb-1">Special note (optional)</span>
          <input value={form.specialNote} onChange={set('specialNote')} className={field} /></label>
        <label><span className="block text-xs font-bold text-slate-600 mb-1">Reward (৳)</span>
          <input required type="number" min="0" step="0.01" value={form.rewardAmount} onChange={set('rewardAmount')} className={field} /></label>
        <label><span className="block text-xs font-bold text-slate-600 mb-1">Reward type</span>
          <select value={form.rewardType} onChange={set('rewardType')} className={field}>
            <option value="cash">Cash</option>
            <option value="points">Points</option>
          </select></label>
        <label><span className="block text-xs font-bold text-slate-600 mb-1">Starts at</span>
          <input required type="datetime-local" value={form.startsAt} onChange={set('startsAt')} className={field} /></label>
        <label><span className="block text-xs font-bold text-slate-600 mb-1">Ends at</span>
          <input required type="datetime-local" value={form.endsAt} onChange={set('endsAt')} className={field} /></label>
        <div className="sm:col-span-2">
          <MediaField label="Image" hint="Pick from the Media Library, or upload a new image" value={image} onChange={setImage} />
        </div>
        <div className="sm:col-span-2">
          <button disabled={busy} className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
            {creating ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>

      <div className="bg-white border rounded-2xl p-5">
        <h2 className="font-extrabold mb-3">All tasks</h2>
        {isLoading && <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />}
        {!isLoading && tasks.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No tasks yet.</p>}
        <ul className="divide-y">
          {tasks.map((t) => (
            <li key={t._id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{t.title}</p>
                <p className="text-xs text-slate-400">{new Date(t.startsAt).toLocaleDateString()} – {new Date(t.endsAt).toLocaleDateString()}</p>
              </div>
              <span className="font-extrabold text-sm text-harvest-700 whitespace-nowrap">৳{t.rewardAmount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
