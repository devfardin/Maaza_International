'use client';
// News post page.
//   • HTML + CSS post  → only the admin's design is shown.
//   • Text editor post → full notice image, notice type, published date,
//                        short description and long description.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useGetNewsByIdQuery } from '@/redux/features/apiSlice';
import NewsContent from '@/components/shared/NewsContent';
import SafeHtml from '@/components/shared/SafeHtml';
import { NOTICE_STYLE, formatNewsDate, postFormat } from '@/lib/news';

function BackLink() {
  return (
    <Link href="/dashboard/news" className="inline-flex items-center gap-1 text-sm font-extrabold text-harvest-700 hover:underline">
      ← All news
    </Link>
  );
}

export default function NewsDetailPage() {
  const { newsId } = useParams();
  const { data, isLoading, isError } = useGetNewsByIdQuery(newsId, { skip: !newsId });
  const post = data?.data;

  if (isLoading) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl border bg-white" />;

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border bg-white p-10 text-center">
        <p className="text-4xl">📰</p>
        <p className="mt-3 font-bold text-slate-700">This post could not be found</p>
        <div className="mt-5"><BackLink /></div>
      </div>
    );
  }

  // HTML + CSS post: the design only
  if (postFormat(post) === 'html') {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <BackLink />
        <section className="overflow-hidden rounded-3xl border bg-white p-4 shadow-soft sm:p-8">
          <NewsContent html={post.htmlContent} css={post.cssContent} minHeight={200} />
        </section>
      </div>
    );
  }

  // Text editor post
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <BackLink />

      <header className="overflow-hidden rounded-3xl border bg-white shadow-soft">
        {post.coverImage && (
          <div className="flex items-center justify-center bg-slate-100 p-4 sm:p-6">
            {/* full image, contained — never cut */}
            <img src={post.coverImage} alt={post.title} className="max-h-[75vh] w-full object-contain" />
          </div>
        )}
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${NOTICE_STYLE[post.tag] || 'bg-slate-100 text-slate-600'}`}>
              {post.tag}
            </span>
            <small className="text-xs text-slate-400">{formatNewsDate(post.publishedAt)}</small>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{post.title}</h1>
          {post.summary && <p className="mt-3 text-sm font-semibold leading-7 text-slate-600 sm:text-base">{post.summary}</p>}
        </div>
      </header>

      {post.longDescription && (
        <section className="rounded-3xl border bg-white p-5 shadow-soft sm:p-8">
          <SafeHtml html={post.longDescription} className="text-sm leading-7 text-slate-700 sm:text-base" />
        </section>
      )}
    </article>
  );
}
