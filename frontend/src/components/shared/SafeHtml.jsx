'use client';
// Renders sanitised HTML. On the server (no DOM for DOMPurify) it renders nothing;
// the sanitised markup appears on the client without an effect-driven state update.
import { useSyncExternalStore } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

const noopSubscribe = () => () => {};

export default function SafeHtml({ html, className = '' }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const clean = isClient ? sanitizeHtml(html) : '';
  return <div className={`prose-maaza ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
