'use client';

// News page — shows announcements and educational articles

const NEWS = [
  {
    emoji: '🌿',
    gradient: 'from-lime-100 to-harvest-200',
    tag: 'ANNOUNCEMENT',
    tagColor: 'text-harvest-700',
    title: 'Welcome to the updated member dashboard',
    desc: 'A more organized place to manage wallet activity, view products, follow requests and discover community updates.',
    date: '27 October 2026 · 3 min read',
  },
  {
    emoji: '🛡️',
    gradient: 'from-sky-100 to-teal-200',
    tag: 'ACCOUNT SECURITY',
    tagColor: 'text-sky-700',
    title: 'Keep your account and payment details safe',
    desc: 'Never share PINs or OTPs. Review recipient details carefully and keep payment receipts.',
    date: '24 October 2026 · 4 min read',
  },
];

export default function NewsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">News & announcements</h1>
        <p className="text-sm text-slate-500 mt-1">Important notices and educational updates.</p>
      </div>

      <div className="space-y-4">
        {NEWS.map(({ emoji, gradient, tag, tagColor, title, desc, date }) => (
          <article key={title} className="bg-white border rounded-2xl p-4 flex gap-4">
            {/* Article thumbnail */}
            <div className={`w-24 sm:w-32 shrink-0 rounded-xl bg-gradient-to-br ${gradient} grid place-items-center text-4xl`}>
              {emoji}
            </div>
            <div>
              <span className={`text-xs font-extrabold ${tagColor}`}>{tag}</span>
              <h2 className="font-extrabold mt-2">{title}</h2>
              <p className="text-sm text-slate-500 leading-6 mt-2">{desc}</p>
              <small className="text-xs text-slate-400 block mt-3">{date}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
