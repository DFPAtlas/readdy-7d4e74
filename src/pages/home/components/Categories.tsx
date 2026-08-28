const categories = [
  {
    icon: 'ri-code-box-line',
    title: 'Web Development',
    description: 'Frontend, backend, full-stack, and CMS development across modern frameworks and platforms.',
  },
  {
    icon: 'ri-palette-line',
    title: 'UX and UI Design',
    description: 'User research, wireframing, prototyping, visual design, and design systems.',
  },
  {
    icon: 'ri-bug-line',
    title: 'Software Testing and UAT',
    description: 'Manual and automated testing, user acceptance testing, and quality assurance.',
  },
  {
    icon: 'ri-robot-line',
    title: 'AI and Automation',
    description: 'Machine learning, process automation, data pipelines, and AI integration.',
  },
  {
    icon: 'ri-bar-chart-box-line',
    title: 'Data and Research',
    description: 'Data analysis, market research, user research, and business intelligence.',
  },
  {
    icon: 'ri-file-text-line',
    title: 'Content and Documentation',
    description: 'Technical writing, content strategy, documentation, and instructional design.',
  },
  {
    icon: 'ri-shield-keyhole-line',
    title: 'Cybersecurity and Technical Operations',
    description: 'Security assessments, compliance, DevOps, infrastructure, and IT operations.',
  },
  {
    icon: 'ri-building-line',
    title: 'Business and Project Support',
    description: 'Project coordination, business analysis, PMO support, and operational delivery.',
  },
];

export default function Categories() {
  return (
    <section id="categories" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <p className="text-xs md:text-sm font-semibold text-dfp-blue-700 uppercase tracking-wider mb-3">Freelancer Categories</p>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-dfp-stone-900">
            Find your category
          </h2>
          <p className="mt-3 text-sm md:text-base text-dfp-stone-600 max-w-2xl mx-auto">
            DFP works with skilled freelancers across eight professional disciplines. Select the category that best matches your expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="group bg-dfp-stone-50 rounded-xl p-5 md:p-6 border border-dfp-stone-100 hover:border-dfp-blue-200 hover:bg-white transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-dfp-blue-50 flex items-center justify-center mb-4 group-hover:bg-dfp-blue-100 transition-colors">
                <i className={`${cat.icon} text-lg text-dfp-blue-600`}></i>
              </div>
              <h3 className="font-display text-sm md:text-base font-semibold text-dfp-stone-900 mb-1.5">{cat.title}</h3>
              <p className="text-xs md:text-sm text-dfp-stone-500 leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}