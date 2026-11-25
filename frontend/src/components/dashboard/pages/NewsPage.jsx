'use client';
// News & Updates list — one card per row: notice image on the left (full image, never cut),
// notice type, title, short description and published date on the right.
import Link from 'next/link';
import { useGetNewsQuery } from '@/redux/features/apiSlice';
import { NOTICE_STYLE, formatNewsDate } from '@/lib/news';
import PageTitle from '../PageTitle';

export default function NewsPage() {
  const { data, isLoading, isError } = useGetNewsQuery(undefined, { pollingInterval: 120000 });
  const posts = data?.data ?? [];

  return (
    <div className="space-y-5">
      <PageTitle titleKey="NEWS &amp; UPDATES"/>
      
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl border bg-white" />)}
        </div>
      )}

      {isError && <p className="py-12 text-center text-sm text-slate-500">Could not load news. Please try again later.</p>}

      {!isLoading && !isError && posts.length === 0 && (
        <div className="rounded-3xl border bg-white p-10 text-center">
          <p className="text-4xl">📰</p>
          <p className="mt-3 font-bold text-slate-700">No news yet</p>
          <p className="mt-1 text-sm text-slate-500">New announcements will appear here.</p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/dashboard/news/${post._id}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:flex-row"
            >
              {/* Left: the whole notice image, contained — nothing is cut on any side */}
              <div className="flex shrink-0 items-center justify-center bg-slate-100 p-3 sm:w-64 md:w-72">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="max-h-56 w-full object-contain sm:max-h-44" />
                ) : (
                  <div className="grid h-40 w-full place-items-center rounded-2xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-lime-400 text-5xl">📰</div>
                )}
              </div>

              {/* Right: information */}
              <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${NOTICE_STYLE[post.tag] || 'bg-slate-100 text-slate-600'}`}>
                    {post.tag}
                  </span>
                  <small className="text-xs text-slate-400">{formatNewsDate(post.publishedAt)}</small>
                </div>
                <h2 className="mt-3 text-lg font-extrabold leading-snug text-slate-900 sm:text-xl">{post.title}</h2>
                {post.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{post.summary}</p>}
                <span className="mt-auto pt-4 text-sm font-extrabold text-harvest-700 group-hover:underline">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
