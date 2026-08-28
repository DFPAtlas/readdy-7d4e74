const stages = [
  {
    step: '01',
    icon: 'ri-file-text-line',
    title: 'Apply',
    description: 'Submit your application with your skills, experience, portfolio, and preferred categories. Tell us about the work you do best.',
  },
  {
    step: '02',
    icon: 'ri-check-double-line',
    title: 'Complete Verification',
    description: 'We review your profile, verify your experience, and check your documents, identity, and professional references.',
  },
  {
    step: '03',
    icon: 'ri-user-star-line',
    title: 'Get Approved',
    description: 'Once approved, you gain access to the freelancer portal where you can see available work and manage your profile.',
  },
  {
    step: '04',
    icon: 'ri-briefcase-line',
    title: 'Work with DFP',
    description: 'Accept assignments, collaborate with DFP project managers, deliver quality work, and build a long-term professional relationship.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-dfp-stone-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <p className="text-xs md:text-sm font-semibold text-dfp-green-700 uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-dfp-stone-900">
            Your path to working with DFP
          </h2>
          <p className="mt-3 text-sm md:text-base text-dfp-stone-600 max-w-2xl mx-auto">
            A clear, transparent process designed to match the right freelancers with the right projects.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage, index) => (
            <div key={stage.step} className="relative group">
              {/* Connector line between cards (desktop only) */}
              {index < stages.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+20px)] w-[calc(100%-40px)] h-px">
                  <div className="w-full h-full bg-dfp-stone-200 group-hover:bg-dfp-green-300 transition-colors"></div>
                </div>
              )}

              <div className="bg-white rounded-xl p-6 md:p-7 border border-dfp-stone-100 hover:border-dfp-green-200 transition-all relative z-10">
                <div className="w-12 h-12 rounded-xl bg-dfp-green-50 flex items-center justify-center mb-5">
                  <i className={`${stage.icon} text-xl text-dfp-green-600`}></i>
                </div>
                <p className="text-xs font-bold text-dfp-green-600 mb-2 tracking-wide">{stage.step}</p>
                <h3 className="font-display text-lg font-semibold text-dfp-stone-900 mb-2">{stage.title}</h3>
                <p className="text-sm text-dfp-stone-600 leading-relaxed">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}