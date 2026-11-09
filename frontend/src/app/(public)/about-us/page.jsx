// Landing about page

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">About Maaza International</h1>
      <p className="text-lg text-harvest-500 leading-8 mb-8">
        Maaza International is a platform designed to help members manage their financial activities, explore investment products, and grow their earnings through a trusted community.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-extrabold mb-3">Our Mission</h2>
          <p className="text-slate-600 leading-7">
            To empower members with transparent tools and opportunities to grow their wealth responsibly while building a supportive community.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">What We Offer</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex gap-3">
              <span className="text-harvest-700 font-bold">✓</span>
              <span><b>Wallet Management</b> — Secure recharge, withdrawal and transaction tracking</span>
            </li>
            <li className="flex gap-3">
              <span className="text-harvest-700 font-bold">✓</span>
              <span><b>Product Catalog</b> — Verified products with clear terms and eligibility</span>
            </li>
            <li className="flex gap-3">
              <span className="text-harvest-700 font-bold">✓</span>
              <span><b>Task Bonuses</b> — Earn rewards by completing simple tasks</span>
            </li>
            <li className="flex gap-3">
              <span className="text-harvest-700 font-bold">✓</span>
              <span><b>Community</b> — Connect with members and share updates</span>
            </li>
            <li className="flex gap-3">
              <span className="text-harvest-700 font-bold">✓</span>
              <span><b>Referral Program</b> — Earn bonuses by inviting friends</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">Security & Trust</h2>
          <p className="text-slate-600 leading-7">
            We prioritize your security with verified payment methods, encrypted transactions, and transparent account management. All financial activities are tracked and reviewed for your protection.
          </p>
        </section>
      </div>
    </div>
  );
}
