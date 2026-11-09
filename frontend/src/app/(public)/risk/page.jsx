// Risk Disclosure page
// This page explains the risks associated with using Maaza International's services

export default function RiskPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-8">Risk Disclosure</h1>
      
      <div className="space-y-8 text-slate-600">
        <section>
          <h2 className="text-2xl font-extrabold mb-3">1. Important Risk Warning</h2>
          <p className="leading-7">
            Trading and investment activities involve a high degree of risk. The value of products and investments can go down as well
            as up. Past performance is not indicative of future results. You should be aware of all the risks associated with such
            activities and seek advice from an independent financial advisor if you have any doubts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">2. Market Risk</h2>
          <p className="leading-7">
            Market risk refers to the possibility that the value of products may fluctuate due to market conditions, economic factors,
            political events, and other variables beyond our control. These fluctuations can result in losses to your investment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">3. Liquidity Risk</h2>
          <p className="leading-7">
            Some products may have limited liquidity, meaning there may not always be a ready market for buying or selling. This can
            make it difficult to exit positions at favorable prices, especially during periods of market volatility.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">4. Counterparty Risk</h2>
          <p className="leading-7">
            When you engage in transactions through Harvest, you are exposed to counterparty risk - the risk that the other party
            to a transaction may default or fail to perform their obligations. We take measures to mitigate this risk, but it cannot
            be eliminated entirely.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">5. Technology Risk</h2>
          <p className="leading-7">
            Our platform relies on technology systems that are subject to potential failures, cyber-attacks, or other disruptions.
            While we implement robust security measures, there is always a risk of system failures that could affect your ability to
            access your account or execute transactions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">6. Regulatory Risk</h2>
          <p className="leading-7">
            Changes in laws, regulations, or regulatory requirements could affect the operation of our platform or the value of
            products. Regulatory changes could result in restrictions on activities, increased costs, or the inability to offer
            certain products or services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">7. Leverage Risk</h2>
          <p className="leading-7">
            If you use leverage in your transactions, your losses can be significantly greater than your initial investment. Leverage
            amplifies both gains and losses, and you may be required to deposit additional funds to maintain your positions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">8. No Guarantee of Profits</h2>
          <p className="leading-7">
            Maaza International does not guarantee any profit from your activities on our platform. All investment decisions are your responsibility.
            You should only invest money that you can afford to lose and should not invest based solely on expectations of profit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">9. Eligibility and Suitability</h2>
          <p className="leading-7">
            You represent and warrant that you are of legal age to enter into binding agreements and have the financial expertise,
            experience, and resources to understand the risks involved in the activities you undertake on our platform. You alone
            are responsible for determining whether any investment, strategy, or transaction is appropriate for you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">10. Acknowledgment</h2>
          <p className="leading-7">
            By using Harvest, you acknowledge that you have read and understood this risk disclosure and accept all the risks associated
            with using our platform. You agree that you are making investment decisions at your own risk and that Maaza International shall not
            be liable for any losses you may incur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold mb-3">Contact Us</h2>
          <p className="leading-7 mt-4">
            If you have any questions about this Risk Disclosure, please contact us at:
            <br /><br />
            Email: risk@maazainternational.com<br />
            Phone: +880 1234 567890
          </p>
        </section>
      </div>
    </div>
  );
}
