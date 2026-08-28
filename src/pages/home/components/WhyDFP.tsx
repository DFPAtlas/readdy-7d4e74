const benefits = [
  {
    icon: 'ri-file-list-3-line',
    title: 'Clear work packages',
    description: 'Every assignment comes with defined scope, deliverables, acceptance criteria, and milestones so you always know what is expected.',
  },
  {
    icon: 'ri-shield-user-line',
    title: 'Secure project access',
    description: 'You receive controlled, time-limited access to only the systems, repositories, and files your assignment requires.',
  },
  {
    icon: 'ri-flag-line',
    title: 'Milestone-based delivery',
    description: 'Work is structured around clear milestones with scheduled reviews, keeping projects on track and expectations aligned.',
  },
  {
    icon: 'ri-feedback-line',
    title: 'Professional feedback',
    description: 'Receive structured, constructive feedback from experienced DFP project managers who understand your discipline.',
  },
  {
    icon: 'ri-hand-heart-line',
    title: 'Long-term relationships',
    description: 'DFP values lasting freelancer partnerships. Consistent quality leads to repeat work and preferred freelancer status.',
  },
  {
    icon: 'ri-stack-line',
    title: 'Multiple product opportunities',
    description: 'DFP runs several digital products. Approved freelancers gain visibility across the full portfolio of project needs.',
  },
];

export default function WhyDFP() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <p className="text-xs md:text-sm font-semibold text-dfp-blue-700 uppercase tracking-wider mb-3">Why Work with DFP</p>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-dfp-stone-900">
            More than just project work
          </h2>
          <p className="mt-3 text-sm md:text-base text-dfp-stone-600 max-w-2xl mx-auto">
            DFP is building a professional network where skilled freelancers can do their best work with clarity, respect, and fair terms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-4 p-5 rounded-xl border border-dfp-stone-100 hover:border-dfp-stone-200 bg-dfp-stone-50/50 transition-colors">
              <div className="w-11 h-11 rounded-lg bg-dfp-blue-50 flex items-center justify-center flex-shrink-0">
                <i className={`${benefit.icon} text-dfp-blue-600 text-lg`}></i>
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-dfp-stone-900 mb-1">{benefit.title}</h3>
                <p className="text-xs md:text-sm text-dfp-stone-500 leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}