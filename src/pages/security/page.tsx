import { Link } from 'react-router-dom';

export default function SecurityPage() {
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
          <h1 className="text-2xl font-display font-semibold text-dfp-stone-900 mb-2">Security and Confidentiality</h1>
          <p className="text-xs text-dfp-stone-400 mb-8">Last updated: July 2026</p>
          <div className="space-y-6 text-sm text-dfp-stone-600 leading-relaxed">
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="approach">1. Our Approach</a></h4>
              <p>Digital Footprint takes security seriously. We implement industry-standard security measures to protect freelancer data, client information, and project materials. All data is encrypted in transit and at rest.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="access-control">2. Access Control</a></h4>
              <p>Freelancers only receive access to the projects, systems, files, and client information they are specifically authorised to use. Access is granted on a need-to-know basis and is regularly reviewed.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="data-protection">3. Data Protection</a></h4>
              <p>We use encrypted storage, secure file transfer, access logging, and regular security audits to protect all freelancer and client data. Your documents and personal information are never publicly accessible.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="your-responsibilities">4. Your Responsibilities</a></h4>
              <p>As a freelancer, you are responsible for maintaining the security of your account credentials, using secure internet connections when accessing the portal, and immediately reporting any suspected security incidents to the DFP team.</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}