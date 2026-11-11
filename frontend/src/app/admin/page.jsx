'use client';
import { useSelector } from 'react-redux';
import {
  useGetAllUsersQuery,
  useGetAllTransactionsQuery,
  useGetAllDepositRequestsQuery,
} from '@/redux/features/apiSlice';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const user = useSelector((s) => s.auth.user);

  const { data: usersData,    isLoading: usersLoading }    = useGetAllUsersQuery();
  const { data: txData,       isLoading: txLoading }       = useGetAllTransactionsQuery();
  const { data: depositData,  isLoading: depositLoading }  = useGetAllDepositRequestsQuery();

  const users    = usersData?.data    || [];
  const txs      = txData?.data       || [];
  const deposits = depositData?.data  || [];

  const activeUsers   = users.filter((u) => u.status === 'active').length;
  const pendingDeposits = deposits.filter((d) => d.status === 'pending').length;
  const totalDeposited  = deposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const stats = [
    { icon: '👥', label: 'Total Users',        value: usersLoading   ? '…' : users.length,      sub: `${activeUsers} active`,          color: 'bg-blue-50 text-blue-700'    },
    { icon: '💰', label: 'Total Transactions',  value: txLoading      ? '…' : txs.length,        sub: 'all time',                       color: 'bg-emerald-50 text-emerald-700' },
    { icon: '⏳', label: 'Pending Deposits',    value: depositLoading ? '…' : pendingDeposits,   sub: 'awaiting approval',              color: 'bg-amber-50 text-amber-700'  },
    { icon: '✅', label: 'Total Deposited',     value: depositLoading ? '…' : `৳${(totalDeposited/100).toLocaleString()}`, sub: 'approved deposits', color: 'bg-violet-50 text-violet-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.fullName}. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl grid place-items-center text-xl mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-2xl font-extrabold mt-1">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { href: '/admin/users',        icon: '👥', label: 'Manage Users',        desc: 'View, block or delete users' },
          { href: '/admin/products',     icon: '📦', label: 'Products & Stock',    desc: 'Upload and manage products' },
          { href: '/admin/deposits',     icon: '💳', label: 'Deposit Requests',    desc: 'Approve or reject deposits' },
          { href: '/admin/transactions', icon: '📋', label: 'All Transactions',    desc: 'Full transaction history' },
          { href: '/admin/activity',     icon: '🛡️', label: 'Activity & Devices',  desc: 'IP, device, browser, OS' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white border rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="text-2xl mb-3">{item.icon}</div>
            <b className="block text-sm">{item.label}</b>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent pending deposits */}
      <div className="bg-white border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold">Pending Deposit Requests</h2>
          <Link href="/admin/deposits" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
        </div>
        {depositLoading && <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />}
        {!depositLoading && deposits.filter((d) => d.status === 'pending').length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">No pending deposit requests.</p>
        )}
        {!depositLoading && deposits.filter((d) => d.status === 'pending').slice(0, 5).map((d) => (
          <div key={d._id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="text-sm font-semibold">{d.userId?.fullName || 'Unknown'}</p>
              <p className="text-xs text-slate-400">{d.methodCode} · TxID: {d.transactionId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">৳{(d.amount / 100).toFixed(2)}</p>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">pending</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-white border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold">Recent Users</h2>
          <Link href="/admin/users" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
        </div>
        {usersLoading && <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />}
        {!usersLoading && users.slice(0, 5).map((u) => (
          <div key={u._id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold shrink-0">
                {u.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{u.fullName}</p>
                <p className="text-xs text-slate-400">{u.phone}</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              u.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
              u.status === 'suspended' ? 'bg-amber-50 text-amber-700' :
              'bg-rose-50 text-rose-700'
            }`}>{u.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
