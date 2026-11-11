'use client';
import { useState } from 'react';
import { notify } from '@/lib/toast';

// Copies `value` to the clipboard and shows a top-right confirmation.
export default function CopyButton({ value, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for older browsers / non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      notify.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify.error('Could not copy. Please select the text and copy it manually.');
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${copied ? 'bg-harvest-700 text-white border-harvest-700' : 'bg-white text-slate-700 hover:bg-slate-50'} ${className}`}
    >
      {copied ? '✓ Copied' : `⧉ ${label}`}
    </button>
  );
}
