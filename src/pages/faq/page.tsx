import { Link } from 'react-router-dom';

const FAQS = [
  { q: 'How long does the approval process take?', a: 'Applications are typically reviewed within 3-5 working days. You will receive a notification in the portal once a decision has been made.' },
  { q: 'What rates should I set?', a: 'Set rates that reflect your experience and market standards. During the application process, you can specify your hourly and day rates. DFP may discuss rate adjustments for specific projects.' },
  { q: 'How do I access project work?', a: 'Once approved, you will see eligible work opportunities in your portal dashboard. Opportunities are matched based on your skills, experience, and availability.' },
  { q: 'How does invoicing work?', a: 'Invoicing features will be enabled in a future phase of the portal. For now, project invoicing is handled directly with the DFP team.' },
  { q: 'Is my information confidential?', a: 'Yes. All freelancer data is stored securely and only shared with authorised DFP staff on a need-to-know basis. See our Security page for full details.' },
  { q: 'What if my application is rejected?', a: 'If your application is not approved, you will receive a notification with the reason. You may reapply after addressing the feedback, typically after a 3-month waiting period.' },
  { q: 'Can I work on multiple DFP projects simultaneously?', a: 'Yes, subject to your stated availability and capacity. The portal will help you manage your commitments across projects.' },
];

export default function FAQPage() {
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
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-2xl font-display font-semibold text-dfp-stone-900 mb-8">Frequently Asked Questions</h1>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <details key={i} className="group bg-white rounded-lg border border-dfp-stone-200">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                <span className="text-sm font-medium text-dfp-stone-800 pr-4">{faq.q}</span>
                <i className="ri-arrow-down-s-line text-dfp-stone-400 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-5 pb-4">
                <p className="text-sm text-dfp-stone-500 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}