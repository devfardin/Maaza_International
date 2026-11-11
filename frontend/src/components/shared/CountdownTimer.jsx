'use client';
import { useEffect, useState } from 'react';

// Formats a millisecond duration as "1d 04:12:09" or "04:12:09"
export function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const hms = [hours, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
  return days > 0 ? `${days}d ${hms}` : hms;
}

// Live countdown to `target` (ISO string / Date). Calls onDone once it reaches zero.
export default function CountdownTimer({ target, onDone, doneLabel = 'Ready now', className = '' }) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = targetMs - now;

  // Notify the parent once, when the timer reaches zero
  const finished = remaining <= 0;
  useEffect(() => {
    if (finished && onDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (!target || Number.isNaN(targetMs)) return null;
  if (remaining <= 0) {
    return <span className={`font-extrabold text-emerald-700 ${className}`}>{doneLabel}</span>;
  }
  return (
    <span className={`font-mono font-extrabold tabular-nums text-harvest-800 ${className}`} aria-live="off">
      {formatCountdown(remaining)}
    </span>
  );
}
