'use client';
// Language switcher used in the public navbar and the dashboard header.
import { LANGUAGES, useI18n } from '@/lib/i18n';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  return (
    <label className={`flex items-center gap-1.5 rounded-xl border px-2 sm:px-2.5 py-2 text-xs font-semibold ${className}`} aria-label={t('header.language')}>
      <span aria-hidden="true">文</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent outline-none cursor-pointer">
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
}
