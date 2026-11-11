'use client';
import { createContext, useContext, useState } from 'react';
import { notify } from '@/lib/toast';

// DashboardContext — shared state available to every dashboard page
// Provides: showToast, openModal, closeModal, savedBank, setSavedBank

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  // ── Toast ──────────────────────────────────────────────────────
  // Shows a top-right toast (sonner). type: 'success' | 'error' | 'info' | 'warning'
  function showToast(message, type = 'success') {
    const fn = notify[type] || notify.info;
    fn(message);
  }

  // ── Modal ──────────────────────────────────────────────────────
  const [modal, setModal] = useState({ open: false, tag: '', title: '', body: null });

  function openModal(tag, title, body) {
    setModal({ open: true, tag, title, body });
  }

  function closeModal() {
    setModal(m => ({ ...m, open: false }));
  }

  // ── Saved bank (payout method) ─────────────────────────────────
  const [savedBank, setSavedBank] = useState(null);

  return (
    <DashboardContext.Provider value={{ showToast, openModal, closeModal, modal, savedBank, setSavedBank }}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook — use this in any dashboard page to access shared state
export function useDashboard() {
  return useContext(DashboardContext);
}
