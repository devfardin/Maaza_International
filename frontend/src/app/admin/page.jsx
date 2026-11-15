'use client';
import { useSelector } from 'react-redux';
import {
  useGetAllUsersQuery,
  useGetAllDepositRequestsQuery,
  useGetAdminDashboardStatsQuery,
  useGetAdminPaymentMethodsQuery,
} from '@/redux/features/apiSlice';
import { useState } from 'react';
import { formatBDT } from '@/components/shared/money';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const user = useSelector((s) => s.auth.user);

  const { data: usersData,    isLoading: usersLoading }    = useGetAllUsersQuery();
  const { data: depositData,  isLoading: depositLoading }  = useGetAllDepositRequestsQuery();
  const { data: statsData,    isLoading: statsLoading }    = useGetAdminDashboardStatsQuery();

  const users    = usersData?.data    || [];
  const deposits = depositData?.data  || [];

  // Pending deposits filtered by payment method code (e.g. bk-9157)
  const [codeFilter, setCodeFilter] = useState('');
  const { data: methodsData } = useGetAdminPaymentMethodsQuery();
  const pendingDeposits_ = deposits.filter((d) => d.status === 'pending');
  const pendingFiltered = codeFilter ? pendingDeposits_.filter((d) => d.methodCode === codeFilter) : pendingDeposits_;
  const s0 = statsData?.data;
  const money = (v) => (statsLoading || !s0 ? '…' : formatBDT(v));

  const stats = [
    { icon: '👥', label: 'Total Users',         value: statsLoading ? '…' : s0?.totalUsers ?? 0,           sub: 'registered members',          color: 'bg-blue-50 text-blue-700' },
    { icon: '💳', label: 'Total Deposits',      value: money(s0?.totalDeposits),                             sub: `${s0?.depositCount ?? 0} approved`, color: 'bg-emerald-50 text-emerald-700' },
    { icon: '💸', label: 'Total Withdrawals',   value: money(s0?.totalWithdrawals),                          sub: `${s0?.withdrawalCount ?? 0} paid`,  color: 'bg-violet-50 text-violet-700' },
    { icon: '⏳', label: 'Pending Deposits',    value: statsLoading ? '…' : s0?.pendingDeposits ?? 0,      sub: 'awaiting approval',           color: 'bg-amber-50 text-amber-700' },
    { icon: '🧾', label: 'Pending Withdrawals', value: statsLoading ? '…' : s0?.pendingWithdrawals ?? 0,   sub: 'awaiting payout',             color: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.fullName}. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl grid place-items-center text-xl mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-2xl font-extrabold mt-1">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Member wallets: how much money members hold right now (all members added together) */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { icon: '💰', label: 'Member balance wallets', value: money(s0?.balanceWalletTotal), sub: 'withdrawable, all members combined', color: 'bg-harvest-50 text-harvest-700' },
          { icon: '🔋', label: 'Member recharge wallets', value: money(s0?.rechargeWalletTotal), sub: 'deposit wallet, all members combined', color: 'bg-sky-50 text-sky-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl grid place-items-center text-2xl shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-2xl font-extrabold mt-0.5">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
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
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setCodeFilter('')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${codeFilter === '' ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            All codes
          </button>
          {(methodsData?.data || []).map((m) => (
            <button key={m.code} onClick={() => setCodeFilter(m.code)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${codeFilter === m.code ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {m.name} <span className="opacity-70">({m.code})</span>
            </button>
          ))}
        </div>
        {!depositLoading && pendingFiltered.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">No pending deposit requests{codeFilter ? ` for ${codeFilter}` : ''}.</p>
        )}
        {!depositLoading && pendingFiltered.slice(0, 5).map((d) => (
          <div key={d._id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="text-sm font-semibold">{d.userId?.fullName || 'Unknown'}</p>
              <p className="text-xs text-slate-400">{d.methodCode} · TxID: {d.transactionId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">৳{Number(d.amount).toFixed(2)}</p>
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
