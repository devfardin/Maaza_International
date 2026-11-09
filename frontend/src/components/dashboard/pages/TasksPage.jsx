'use client';

// Tasks page — shows available bonus tasks the user can complete for rewards

const TASKS = [
  {
    name: 'Share our announcement',
    emoji: '📣',
    gradient: 'from-violet-100 to-purple-200',
    reward: '৳20',
    desc: 'Share an approved public announcement and help others discover official updates.',
  },
  {
    name: 'Complete your profile',
    emoji: '📝',
    gradient: 'from-amber-100 to-orange-200',
    reward: '৳30',
    desc: 'Review your contact information and keep your account details accurate.',
  },
  {
    name: 'Read the safety guide',
    emoji: '📚',
    gradient: 'from-sky-100 to-teal-200',
    reward: '৳15',
    desc: 'Read the account security guide, product terms and financial risk information.',
  },
];

export default function TasksPage({ openTask }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Task bonus</h1>
        <p className="text-sm text-slate-500 mt-1">Explore tasks, rewards and claim instructions.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {TASKS.map(({ name, emoji, gradient, reward, desc }) => (
          <article key={name} className="bg-white border rounded-2xl overflow-hidden">
            {/* Task banner */}
            <div className={`h-40 bg-gradient-to-br ${gradient} grid place-items-center text-6xl`}>{emoji}</div>
            <div className="p-4">
              <div className="flex justify-between gap-2">
                <h3 className="font-extrabold">{name}</h3>
                <b className="text-harvest-700 whitespace-nowrap">{reward}</b>
              </div>
              <p className="text-sm text-slate-500 leading-6 mt-2">{desc}</p>
              <button
                onClick={() => openTask(name)}
                className="mt-4 w-full border rounded-xl py-3 text-sm font-bold"
              >
                View task details →
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
