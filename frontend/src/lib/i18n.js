// src/lib/i18n.js
// ─────────────────────────────────────────────────────────────────────────────
// Website translator — English (en) and Bangla (bn).
// The chosen language is saved in localStorage and applied everywhere that uses
// the useI18n() hook (header switcher, sidebars, navigation, page titles).
//
//   const { t, lang, setLang } = useI18n();
//   <h1>{t('nav.withdrawals')}</h1>
//
// Missing keys fall back to English, then to the key itself.
// ─────────────────────────────────────────────────────────────────────────────
'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
];

const DICT = {
  en: {
    'brand.tagline': 'Grow with purpose',
    'nav.overview': 'Overview',
    'nav.products': 'Products',
    'nav.myProducts': 'My products',
    'nav.tasks': 'Task bonus',
    'nav.community': 'Community',
    'nav.news': 'News & updates',
    'nav.recharge': 'Recharge wallet',
    'nav.withdrawals': 'Withdrawals',
    'nav.transactions': 'Transactions',
    'nav.bank': 'Bank details',
    'nav.referrals': 'Referral center',
    'nav.profile': 'My profile',
    'nav.deposits': 'Deposits',
    'nav.users': 'Users',
    'nav.adminProducts': 'Products',
    'nav.adminTransactions': 'Transactions',
    'nav.activity': 'Login activity',
    'nav.adminActivity': 'Admin activity',
    'section.workspace': 'WORKSPACE',
    'section.wallet': 'WALLET & ACCOUNT',
    'section.management': 'MANAGEMENT',
    'header.search': 'Search products, tasks, updates...',
    'header.signOut': 'Sign out',
    'header.notifications': 'Notifications',
    'header.language': 'Language',
    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.copy': 'Copy',
    'common.copied': 'Copied to clipboard',
    'common.status': 'Status',
    'common.amount': 'Amount',
    'common.date': 'Date',
    'common.pending': 'Pending',
    'common.approved': 'Approved',
    'common.rejected': 'Rejected',
    'common.noData': 'Nothing to show yet.',
    'overview.title': 'Overview',
    'recharge.title': 'Add funds',
    'withdraw.title': 'Withdraw earnings',
    'withdraw.submit': 'Submit withdrawal request',
    'profile.title': 'My profile',
    'profile.edit': 'Edit profile',
    'products.title': 'My products',
    'bank.title': 'Bank details',
    'transactions.title': 'Transactions',
    'referrals.title': 'Referral center',
    'public.home': 'Home',
    'public.products': 'Products',
    'public.about': 'About',
    'public.contact': 'Contact',
    'public.login': 'Log in',
    'public.getStarted': 'Get started',
  },
  bn: {
    'brand.tagline': 'উদ্দেশ্য নিয়ে বাড়ুন',
    'nav.overview': 'সারসংক্ষেপ',
    'nav.products': 'পণ্যসমূহ',
    'nav.myProducts': 'আমার পণ্য',
    'nav.tasks': 'টাস্ক বোনাস',
    'nav.community': 'কমিউনিটি',
    'nav.news': 'সংবাদ ও আপডেট',
    'nav.recharge': 'ওয়ালেট রিচার্জ',
    'nav.withdrawals': 'উত্তোলন',
    'nav.transactions': 'লেনদেন',
    'nav.bank': 'ব্যাংক বিবরণ',
    'nav.referrals': 'রেফারেল সেন্টার',
    'nav.profile': 'আমার প্রোফাইল',
    'nav.deposits': 'জমা অনুরোধ',
    'nav.users': 'ব্যবহারকারী',
    'nav.adminProducts': 'পণ্য',
    'nav.adminTransactions': 'লেনদেন',
    'nav.activity': 'লগইন কার্যকলাপ',
    'nav.adminActivity': 'অ্যাডমিন কার্যকলাপ',
    'section.workspace': 'ওয়ার্কস্পেস',
    'section.wallet': 'ওয়ালেট ও অ্যাকাউন্ট',
    'section.management': 'ব্যবস্থাপনা',
    'header.search': 'পণ্য, টাস্ক, আপডেট খুঁজুন...',
    'header.signOut': 'লগ আউট',
    'header.notifications': 'নোটিফিকেশন',
    'header.language': 'ভাষা',
    'common.loading': 'লোড হচ্ছে…',
    'common.save': 'সংরক্ষণ করুন',
    'common.cancel': 'বাতিল',
    'common.copy': 'কপি',
    'common.copied': 'ক্লিপবোর্ডে কপি হয়েছে',
    'common.status': 'অবস্থা',
    'common.amount': 'পরিমাণ',
    'common.date': 'তারিখ',
    'common.pending': 'অপেক্ষমাণ',
    'common.approved': 'অনুমোদিত',
    'common.rejected': 'প্রত্যাখ্যাত',
    'common.noData': 'এখনো কিছু নেই।',
    'overview.title': 'সারসংক্ষেপ',
    'recharge.title': 'টাকা যোগ করুন',
    'withdraw.title': 'আয় উত্তোলন',
    'withdraw.submit': 'উত্তোলনের অনুরোধ পাঠান',
    'profile.title': 'আমার প্রোফাইল',
    'profile.edit': 'প্রোফাইল সম্পাদনা',
    'products.title': 'আমার পণ্য',
    'bank.title': 'ব্যাংক বিবরণ',
    'transactions.title': 'লেনদেন',
    'referrals.title': 'রেফারেল সেন্টার',
    'public.home': 'হোম',
    'public.products': 'পণ্যসমূহ',
    'public.about': 'আমাদের সম্পর্কে',
    'public.contact': 'যোগাযোগ',
    'public.login': 'লগ ইন',
    'public.getStarted': 'শুরু করুন',
  },
};

const STORAGE_KEY = 'lang';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  // Always start with English so server and client render the same HTML,
  // then switch to the saved language after mount.
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    // Reading localStorage must happen after mount (server has no storage),
    // so this one-off sync is intentional.
    const saved = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && DICT[saved]) setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!DICT[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLangState(code);
  }, []);

  const t = useCallback(
    (key) => DICT[lang]?.[key] ?? DICT.en[key] ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components still render outside the provider
    return { lang: 'en', setLang: () => {}, t: (key) => DICT.en[key] ?? key };
  }
  return ctx;
}
