import Link from 'next/link';

// src/components/public/PublicFooter.jsx
// Shown at the bottom of all public pages

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-8">

          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-300 to-harvest-700 text-white text-sm grid place-items-center">✦</span>
              <b>Maaza International</b>
            </div>
            <p className="text-sm text-slate-500 leading-6 max-w-xs">Grow with purpose. A platform for members to manage products, wallet and community.</p>
          </div>

          {/* Platform links */}
          <div>
            <p className="text-xs font-extrabold tracking-widest text-slate-400 mb-3">PLATFORM</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/products"   className="hover:text-harvest-700">Products</Link></li>
              <li><Link href="/about-us"   className="hover:text-harvest-700">About Us</Link></li>
              <li><Link href="/contact-us" className="hover:text-harvest-700">Contact</Link></li>
            </ul>
          </div>

          {/* Account links */}
          <div>
            <p className="text-xs font-extrabold tracking-widest text-slate-400 mb-3">ACCOUNT</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/login"     className="hover:text-harvest-700">Log in</Link></li>
              <li><Link href="/login"     className="hover:text-harvest-700">Register</Link></li>
              <li><Link href="/dashboard" className="hover:text-harvest-700">Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-xs font-extrabold tracking-widest text-slate-400 mb-3">LEGAL</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/terms"   className="hover:text-harvest-700">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-harvest-700">Privacy Policy</Link></li>
              <li><Link href="/risk"    className="hover:text-harvest-700">Risk Disclosure</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
          <span>© 2024 Maaza International. All rights reserved.</span>
          <span>Built for members · Grow with purpose</span>
        </div>
      </div>
    </footer>
  );
}
