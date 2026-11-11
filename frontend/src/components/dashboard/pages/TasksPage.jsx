'use client';
import { useGetTasksQuery } from '@/redux/features/apiSlice';

const GRADIENTS = [
  'from-violet-100 to-purple-200',
  'from-amber-100 to-orange-200',
  'from-sky-100 to-teal-200',
  'from-lime-100 to-emerald-200',
];

export default function TasksPage({ openTask }) {
  const { data: tasksData, isLoading } = useGetTasksQuery();
  const tasks = tasksData?.data || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Task bonus</h1>
        <p className="text-sm text-slate-500 mt-1">Explore tasks, rewards and claim instructions.</p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && tasks.length === 0 && (
        <p className="text-slate-400 text-sm py-8 text-center">No tasks available at the moment.</p>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tasks.map((task, idx) => {
          const gradient = GRADIENTS[idx % GRADIENTS.length];
          return (
            <article key={task._id} className="bg-white border rounded-2xl overflow-hidden">
              <div className={`h-40 bg-gradient-to-br ${gradient} grid place-items-center text-6xl`}>
                {task.icon || '✧'}
              </div>
              <div className="p-4">
                <div className="flex justify-between gap-2">
                  <h3 className="font-extrabold">{task.title}</h3>
                  <b className="text-harvest-700 whitespace-nowrap">৳ {task.rewardAmount}</b>
                </div>
                <p className="text-sm text-slate-500 leading-6 mt-2 line-clamp-3">{task.description}</p>
                <button
                  onClick={() => openTask(task)}
                  className="mt-4 w-full border rounded-xl py-3 text-sm font-bold"
                >
                  View task details →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
