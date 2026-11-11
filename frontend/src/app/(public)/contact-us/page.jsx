'use client';
import { useState } from 'react';

// Landing contact page

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Connect to backend API here
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Get in touch</h1>
        <p className="text-lg text-slate-600">Have questions? We&apos;d love to hear from you.</p>
      </div>

      <div className="bg-white border rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="w-full border rounded-xl px-4 py-3 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full border rounded-xl px-4 py-3 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Message</label>
            <textarea
              rows={5}
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              placeholder="Your message..."
              className="w-full border rounded-xl px-4 py-3 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-harvest-700 text-white font-bold hover:bg-harvest-800 transition-colors"
          >
            Send message →
          </button>
        </form>

        {submitted && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold">
            ✓ Message sent! We&apos;ll get back to you soon.
          </div>
        )}
      </div>

      <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
        {[
          { icon: '📧', title: 'Email', value: 'support@maazainternational.com' },
          { icon: '💬', title: 'Chat', value: 'Available 9am-6pm' },
          { icon: '📍', title: 'Location', value: 'Bangladesh' },
        ].map(({ icon, title, value }) => (
          <div key={title}>
            <div className="text-3xl mb-2">{icon}</div>
            <p className="font-bold">{title}</p>
            <p className="text-sm text-slate-600">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
