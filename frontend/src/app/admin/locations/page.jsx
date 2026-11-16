'use client';
// Member locations: how many members live in each district, shown on a map and in a table.
import dynamic from 'next/dynamic';
import { useGetLocationSummaryQuery } from '@/redux/features/apiSlice';
import PageLoader from '@/components/shared/PageLoader';

const LocationMap = dynamic(() => import('@/components/admin/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[460px] w-full rounded-2xl bg-slate-100 animate-pulse" />,
});

function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
    </div>
  );
}

export default function MemberLocationsPage() {
  const { data, isLoading } = useGetLocationSummaryQuery();
  const s = data?.data;

  if (isLoading || !s) return <PageLoader label="Loading member locations…" />;

  const pct = (n) => (s.withLocation ? `${Math.round((n / s.withLocation) * 100)}%` : '0%');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Member locations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Members choose their home district on their profile. Bubbles on the map show how many members live in each district.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Members" value={s.totalMembers.toLocaleString()} />
        <Stat label="With a district" value={s.withLocation.toLocaleString()} />
        <Stat label="No district yet" value={s.withoutLocation.toLocaleString()} />
      </div>

      <LocationMap districts={s.districts} />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
        <div className="bg-white border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">District</th>
                <th className="text-left px-5 py-3">Division</th>
                <th className="text-right px-5 py-3">Members</th>
                <th className="text-right px-5 py-3">Share</th>
              </tr>
            </thead>
            <tbody>
              {s.districts.map((d) => (
                <tr key={d.name} className={`border-b last:border-0 ${d.count ? '' : 'text-slate-400'}`}>
                  <td className="px-5 py-2.5 font-semibold">{d.name}</td>
                  <td className="px-5 py-2.5">{d.division}</td>
                  <td className="px-5 py-2.5 text-right font-extrabold">{d.count}</td>
                  <td className="px-5 py-2.5 text-right">{pct(d.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-2xl p-5 h-fit">
          <h2 className="font-extrabold">By division</h2>
          <ul className="mt-3 space-y-3">
            {s.divisions.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-sm">
                <span>{d.name}</span>
                <span className="font-extrabold">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
