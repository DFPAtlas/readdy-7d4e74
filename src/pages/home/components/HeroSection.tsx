import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative w-full min-h-[620px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=Abstract%20modern%20digital%20workspace%20with%20soft%20muted%20sage%20green%20and%20mineral%20slate%20blue%20geometric%20flowing%20shapes%2C%20clean%20minimal%20professional%20tech%20background%20with%20subtle%20layered%20gradient%20overlays%2C%20warm%20ambient%20lighting%20with%20gentle%20organic%20curves%2C%20no%20text%20or%20people%2C%20elegant%20corporate%20atmosphere%2C%20high%20quality%20abstract%20collaboration%20concept%2C%20editorial%20photography%20style%20with%20soft%20shadows&width=1800&height=1000&seq=dfp-hero-landing-v2&orientation=landscape"
          alt="Abstract professional workspace background"
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
      </div>

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dfp-stone-950/70 via-dfp-stone-950/50 to-dfp-stone-950/80"></div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 md:px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-8">
          <i className="ri-shield-check-line text-dfp-green-400 text-sm"></i>
          <span className="text-white/80 text-xs md:text-sm font-medium">Secure Freelancer Portal by Digital Footprint</span>
        </div>

        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto">
          Work with Digital Footprint on secure digital projects.
        </h1>

        <p className="mt-6 text-base md:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
          Join the DFP Freelancer Network to access approved project opportunities across software, design, testing, research, content, operations, data, automation, and digital services.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link
              to="/portal"
              className="w-full sm:w-auto px-8 py-3.5 bg-dfp-green-600 text-white text-sm md:text-base font-semibold rounded-xl hover:bg-dfp-green-700 transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-dfp-green-600/25"
            >
              Go to Your Portal
              <i className="ri-arrow-right-line ml-2"></i>
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-dfp-green-600 text-white text-sm md:text-base font-semibold rounded-xl hover:bg-dfp-green-700 transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-dfp-green-600/25"
              >
                Apply to Join
                <i className="ri-arrow-right-line ml-2"></i>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white text-sm md:text-base font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all whitespace-nowrap cursor-pointer"
              >
                Freelancer Login
              </Link>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: '8', label: 'Service Categories' },
            { value: '100%', label: 'Secure Access' },
            { value: 'UK-Based', label: 'Projects' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs md:text-sm text-white/55 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}