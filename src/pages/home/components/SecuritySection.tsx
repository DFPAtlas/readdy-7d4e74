export default function SecuritySection() {
  return (
    <section id="security" className="py-16 md:py-24 bg-dfp-stone-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Visual */}
          <div className="w-full lg:w-5/12">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-dfp-stone-100 to-dfp-stone-200">
              <img
                src="https://readdy.ai/api/search-image?query=Abstract%20modern%20digital%20security%20and%20confidentiality%20concept%20with%20soft%20slate%20blue%20and%20sage%20green%20geometric%20shield%20patterns%2C%20clean%20minimal%20professional%20corporate%20atmosphere%2C%20layered%20translucent%20shapes%20with%20warm%20stone%20undertones%2C%20no%20text%20or%20people%2C%20elegant%20secure%20technology%20abstract%2C%20high%20detail%20editorial%20style&width=800&height=600&seq=dfp-security-section&orientation=landscape"
                alt="Security and confidentiality abstract concept"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="w-full lg:w-7/12">
            <p className="text-xs md:text-sm font-semibold text-dfp-green-700 uppercase tracking-wider mb-3">Security and Confidentiality</p>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-dfp-stone-900 mb-6">
              Access you can trust
            </h2>
            <p className="text-sm md:text-base text-dfp-stone-600 leading-relaxed mb-6">
              DFP takes security seriously. Every freelancer in our network receives only the access they need for the specific projects,
              systems, files, and client information they are authorised to use. Nothing more.
            </p>

            <div className="space-y-4">
              {[
                { icon: 'ri-lock-line', title: 'Role-based access', desc: 'You only see projects and files assigned to you. No shared pools or open directories.' },
                { icon: 'ri-file-shield-line', title: 'Private document storage', desc: 'All files are encrypted and accessed through secure, time-limited signed URLs.' },
                { icon: 'ri-eye-off-line', title: 'Client confidentiality', desc: 'Client identities and sensitive details are protected. You access only what your assignment requires.' },
                { icon: 'ri-history-line', title: 'Full audit trail', desc: 'Every action is logged so there is a clear, accountable record of all portal activity.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-dfp-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className={`${item.icon} text-dfp-green-600 text-sm`}></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-dfp-stone-900 mb-0.5">{item.title}</h4>
                    <p className="text-xs md:text-sm text-dfp-stone-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}