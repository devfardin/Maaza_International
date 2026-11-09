// Privacy Policy page
// This page explains how Maaza International collects, uses, and protects user information

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8 text-slate-600">
        <section>
          <h2 className="text-2xl font-extrabold mb-3">1. Information We Collect</h2>
          <p className="leading-7">
            We collect information you provide directly to us when using our services. This includes:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><b>Account Information:</b> Name, email address, phone number, and password</li>
            <li><b>Financial Information:</b> Bank account details, payment method information</li>
            <li><b>Transaction Data:</b> Details of products purchased, transaction history</li>
            <li><b>Profile Information:</b> Profile picture, personal details, and preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">2. How We Use Your Information</h2>
          <p className="leading-7">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process your transactions and send you related information</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Monitor and analyze usage patterns to improve our platform</li>
            <li>Enforce our terms of service and policies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">3. Data Security</h2>
          <p className="leading-7">
            We take the security of your personal information seriously. We use administrative, technical, and physical security
            measures to help protect your personal information. However, no method of transmission over the internet or electronic
            storage is 100% secure, so we cannot guarantee its absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">4. Data Retention</h2>
          <p className="leading-7">
            We retain your personal information for as long as necessary to provide our services and comply with our legal obligations.
            When we no longer need to retain your information, we will securely delete or anonymize it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">5. Your Rights</h2>
          <p className="leading-7">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your information</li>
            <li>Object to processing of your information</li>
            <li>Export your information</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">6. Third-Party Services</h2>
          <p className="leading-7">
            We may use third-party service providers to help us operate our platform. These providers may have access to your
            personal information only to perform tasks on our behalf and are obligated not to disclose or use it for other purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">7. Changes to This Policy</h2>
          <p className="leading-7">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy
            on this page and updating the "Last Updated" date at the bottom.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">8. Contact Us</h2>
          <p className="leading-7">
            If you have any questions about this Privacy Policy, please contact us at:
            <br /><br />
            Email: privacy@maazainternational.com<br />
            Phone: +880 1234 567890
          </p>
        </section>
      </div>
    </div>
  );
}
