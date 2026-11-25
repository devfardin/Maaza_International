'use client';
import { useRouter } from 'next/navigation';
import React from 'react'
import { useI18n } from '@/lib/i18n';

const PageTitle = ({ title, titleKey }) => {
     const { t } = useI18n();
    const router = useRouter();
    return (
        <div className="flex align-middle justify-between">
            <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-lg font-medium text-white hover:underline" >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {t('common.back')}
            </button>
            <h1 className="text-xl font-semibold text-center text-white">{titleKey ? t(titleKey) : title}</h1>
        </div>
    )
}

export default PageTitle
