// Terms of Service page
// This page explains the terms users agree to when using Harvest

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-8">Terms of Service</h1>
      
      <div className="space-y-8 text-slate-600">
        <section>
          <h2 className="text-2xl font-extrabold mb-3">1. Acceptance of Terms</h2>
          <p className="leading-7">
            By accessing and using Harvest, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">2. Use License</h2>
          <p className="leading-7">
            Permission is granted to temporarily view the materials (information or software) on Maaza International's website for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license 
            you may not:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any public or commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software on the site</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">3. Disclaimer</h2>
          <p className="leading-7">
            The materials on Maaza International's website are provided on "as is" basis without warranties of any kind. Maaza International makes no warranties,
            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties
            or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other
            violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">4. Price Accuracy</h2>
          <p className="leading-7">
            We make every effort to ensure that the products displayed on Maaza International are correctly priced and described. However, prices
            can change frequently and we cannot guarantee the accuracy of prices at any given time. The final price for any product
            will be determined by our backend systems at the time of purchase.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">5. Revisions and Errata</h2>
          <p className="leading-7">
            The materials appearing on Maaza International's website could include technical, typographical, or photographic errors. Maaza International does
            not warrant that any of the materials on its website are accurate, complete, or current. Maaza International may make changes to the
            materials contained on its website at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">6. Modifications</h2>
          <p className="leading-7">
            Maaza International may revise these terms of service for its website at any time without notice. By using this website you are agreeing
            to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">7. Governing Law</h2>
          <p className="leading-7">
            These terms and conditions are governed by and construed in accordance with the laws of Bangladesh and you irrevocably
            submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">8. Contact Us</h2>
          <p className="leading-7">
            If you have any questions about these Terms of Service, please contact us at:
            <br /><br />
            Email: legal@maazainternational.com<br />
            Phone: +880 1234 567890
          </p>
        </section>
      </div>
    </div>
  );
}
