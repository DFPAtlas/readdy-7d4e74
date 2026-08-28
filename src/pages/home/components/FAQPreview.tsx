import { useState } from 'react';

const faqs = [
  {
    q: 'How does the freelancer approval process work?',
    a: 'After you submit your application, our team reviews your profile, skills, experience, portfolio, and documents. You may be asked for additional information. Once approved, you get full access to the freelancer portal where you can see available work opportunities.',
  },
  {
    q: 'How are project rates determined?',
    a: 'Rates depend on the project scope, required expertise, and delivery expectations. During your onboarding, you set your preferred rate ranges. DFP then matches opportunities that fit your rate expectations. Final rates are agreed upon before any assignment begins.',
  },
  {
    q: 'What kind of project access do freelancers receive?',
    a: 'Access is strictly role-based and assignment-specific. You receive access only to the systems, repositories, files, and communication channels your current assignment requires. Access is revoked when the assignment ends.',
  },
  {
    q: 'How does invoicing and payment work?',
    a: 'Invoicing is done through the freelancer portal based on completed milestones and approved deliverables. Payment terms are agreed upon during offer acceptance. DFP processes payments according to the schedule defined in your assignment agreement.',
  },
  {
    q: 'What confidentiality terms apply?',
    a: 'All freelancers agree to confidentiality terms during onboarding. Client identities, project details, and internal DFP information must remain confidential. Specific NDAs and security requirements are confirmed per assignment when needed.',
  },
  {
    q: 'Can I work on multiple DFP projects at once?',
    a: 'Yes, approved freelancers can take on multiple assignments as long as they can meet the deadlines and quality expectations for each. Your availability settings in the portal help project managers understand your capacity.',
  },
];

export default function FAQPreview() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-dfp-stone-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <p className="text-xs md:text-sm font-semibold text-dfp-green-700 uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-dfp-stone-900">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm md:text-base text-dfp-stone-600">
            Common questions about joining and working with the DFP Freelancer Network.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-dfp-stone-100 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between px-5 md:px-6 py-4 text-left cursor-pointer hover:bg-dfp-stone-50/50 transition-colors"
              >
                <span className="font-medium text-sm md:text-base text-dfp-stone-900 pr-4">{faq.q}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  openIndex === index ? 'bg-dfp-green-100 text-dfp-green-700' : 'bg-dfp-stone-100 text-dfp-stone-500'
                }`}>
                  <i className={`text-sm transition-transform duration-200 ${openIndex === index ? 'ri-subtract-line' : 'ri-add-line'}`}></i>
                </div>
              </button>
              {openIndex === index && (
                <div className="px-5 md:px-6 pb-5">
                  <p className="text-sm text-dfp-stone-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="/faq"
            className="inline-flex items-center gap-2 text-sm font-medium text-dfp-green-700 hover:text-dfp-green-800 transition-colors cursor-pointer"
          >
            View all FAQs
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      </div>
    </section>
  );
}