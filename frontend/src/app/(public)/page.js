import Container from '@/components/shared/Container';
import Link from 'next/link';

// Landing home page — hero, features, CTA
// This is the main entry point for example.com (direct domain home page)

export default function LandingHome() {
  return (
    <div>
      {/* Hero section */}
      <section className="">
        <Container>
          <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs tracking-widest font-extrabold text-harvest-700 mb-3">WELCOME TO MAAZA INTERNATIONAL</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Grow with purpose</h1>
            <p className="text-lg text-slate-600 leading-7 mb-6">Manage your wallet, explore products, complete tasks and grow your earnings in a trusted community.</p>
            <div className="flex gap-3">
              <Link href="/login" className="px-6 py-3 rounded-xl bg-harvest-700 text-white font-bold hover:bg-harvest-800">
                Get started →
              </Link>
              <Link href="/about-us" className="px-6 py-3 rounded-xl border font-bold hover:bg-slate-50">
                Learn more
              </Link>
            </div>
          </div>
          <div className="h-80 rounded-3xl bg-gradient-to-br from-harvest-50 to-lime-100 grid place-items-center text-8xl">
            🌱
          </div>
        </div>
        </Container>
      </section>

      {/* Features section */}
      <section className="bg-white border-t py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Why choose Maaza International?</h2>
            <p className="text-lg text-slate-600">Everything you need to manage your account and grow your earnings</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '💰', title: 'Wallet Management', desc: 'Recharge, withdraw and track all your transactions in one place.' },
              { icon: '📦', title: 'Product Catalog', desc: 'Explore verified products with clear terms and eligibility.' },
              { icon: '✅', title: 'Task Bonuses', desc: 'Complete tasks and earn rewards instantly.' },
              { icon: '👥', title: 'Community', desc: 'Connect with members, share updates and grow together.' },
              { icon: '📊', title: 'Referral Program', desc: 'Invite friends and earn referral bonuses.' },
              { icon: '🛡️', title: 'Secure & Verified', desc: 'Your account and payments are protected.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-slate-50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-extrabold mb-2">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to get started?</h2>
        <p className="text-lg text-slate-600 mb-6">Join thousands of members growing their earnings with Maaza International.</p>
        <Link href="/login" className="inline-block px-8 py-4 rounded-xl bg-harvest-700 text-white font-bold text-lg hover:bg-harvest-800">
          Create your account →
        </Link>
      </section>
    </div>
  );
}
