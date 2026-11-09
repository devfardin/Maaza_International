'use client';

// src/components/public/PublicNavbar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC NAVBAR — shown on all public pages (/, /about-us, /products, etc.)
//
// HOW TO ADD A NEW NAV LINK:
// Add an object to the `navLinks` array below with { href, label }
// Make sure the matching page exists at src/app/(public)/your-page/page.jsx
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Container from '../shared/Container';

// ── Nav links ─────────────────────────────────────────────────────────────────
const navLinks = [
  { href: '/',           label: 'Home'     },
  { href: '/products',   label: 'Products' },
  { href: '/about-us',   label: 'About'    },
  { href: '/contact-us', label: 'Contact'  },
];

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
     <Container>
       <div className=" h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-300 to-harvest-700 text-white text-lg grid place-items-center">✦</span>
          <b className="text-lg">Maaza International</b>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-harvest-50 text-harvest-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
            Log in
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-xl bg-harvest-700 text-white text-sm font-bold hover:bg-harvest-800 transition-colors">
            Get started →
          </Link>
        </div>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 rounded-xl border grid place-items-center text-slate-600"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
     </Container>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t mt-2 flex gap-2">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 rounded-xl border text-sm font-bold">
              Log in
            </Link>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 rounded-xl bg-harvest-700 text-white text-sm font-bold">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
