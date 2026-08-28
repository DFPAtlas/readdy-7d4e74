import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dfp-stone-50">
      <header className="border-b border-dfp-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-dfp-blue-800 flex items-center justify-center">
              <span className="text-sm font-bold text-white font-display">DFP</span>
            </div>
            <span className="text-xs font-medium text-dfp-stone-500">Digital Footprint</span>
          </Link>
          <Link to="/" className="text-sm text-dfp-stone-500 hover:text-dfp-stone-700">&larr; Back</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <article className="prose prose-stone max-w-none">
          <h1 className="text-2xl font-display font-semibold text-dfp-stone-900 mb-2">Privacy Notice</h1>
          <p className="text-xs text-dfp-stone-400 mb-8">Last updated: July 2026</p>
          <div className="space-y-6 text-sm text-dfp-stone-600 leading-relaxed">
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="introduction">1. Introduction</a></h4>
              <p>Digital Footprint ("DFP", "we", "our", "us") is committed to protecting your privacy. This Privacy Notice explains how we collect, use, store, and protect your personal data when you use the DFP Freelancer Network.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="data-we-collect">2. Data We Collect</a></h4>
              <p>We collect personal information you provide during registration and onboarding, including: name, email address, telephone number, country, timezone, professional skills and experience, business details, portfolio items, and identification documents. We also collect usage data such as login timestamps and portal activity for security and auditing purposes.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="how-we-use">3. How We Use Your Data</a></h4>
              <p>Your data is used to: verify your identity and professional eligibility, match you with suitable project opportunities, manage assignments and payments, communicate with you about your account and available work, comply with legal and regulatory obligations, and improve the Freelancer Network platform.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="sharing">4. Data Sharing</a></h4>
              <p>We do not sell your personal data. We may share relevant professional information with DFP staff who manage freelancer assignments, and with clients where necessary for project delivery — but only the minimum information required for the specific project.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="your-rights">5. Your Rights</a></h4>
              <p>You have the right to access, correct, or delete your personal data. You may also request data portability or restrict processing. To exercise these rights, please contact us through the portal support page.</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}