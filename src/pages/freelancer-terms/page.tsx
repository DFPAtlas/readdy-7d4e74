import { Link } from 'react-router-dom';

export default function FreelancerTermsPage() {
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
          <h1 className="text-2xl font-display font-semibold text-dfp-stone-900 mb-2">Freelancer Application Terms</h1>
          <p className="text-xs text-dfp-stone-400 mb-8">Last updated: July 2026</p>
          <div className="space-y-6 text-sm text-dfp-stone-600 leading-relaxed">
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="eligibility">1. Eligibility</a></h4>
              <p>By applying to the DFP Freelancer Network, you confirm that you are legally authorised to work as a freelancer or contractor in your country of residence, and that all information provided in your application is true and accurate.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="application-review">2. Application Review</a></h4>
              <p>All applications are subject to review by the DFP team. We reserve the right to approve or reject applications at our discretion. Submission of an application does not guarantee approval.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="confidentiality">3. Confidentiality</a></h4>
              <p>As a member of the DFP Freelancer Network, you agree to maintain strict confidentiality regarding all client information, project details, and internal DFP processes you may be exposed to — both during and after your engagement.</p>
            </section>
            <section>
              <h4 className="text-base font-semibold text-dfp-stone-800 mb-2"><a id="professional-standards">4. Professional Standards</a></h4>
              <p>Approved freelancers are expected to maintain high professional standards including timely communication, quality deliverables, adherence to project specifications, and professional conduct in all DFP-related activities.</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}