import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Categories', href: '#categories' },
    { label: 'Security', href: '#security' },
    { label: 'FAQs', href: '#faq' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              scrolled ? 'bg-dfp-green-600' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <i className={`ri-shield-check-line text-lg ${
                scrolled ? 'text-white' : 'text-white'
              }`}></i>
            </div>
            <div>
              <span className={`font-display font-semibold text-base whitespace-nowrap transition-colors ${
                scrolled ? 'text-dfp-stone-900' : 'text-white'
              }`}>
                DFP Freelancer Network
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-dfp-green-600 whitespace-nowrap ${
                  scrolled ? 'text-dfp-stone-700' : 'text-white/90'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to="/portal"
                className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Go to Portal
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    scrolled
                      ? 'text-dfp-stone-700 hover:text-dfp-green-700 hover:bg-dfp-stone-100'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Freelancer Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Apply to Join
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              scrolled ? 'text-dfp-stone-700 hover:bg-dfp-stone-100' : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
          >
            <i className={`text-xl ${mobileOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-dfp-stone-200 shadow-lg rounded-b-2xl pb-4">
            <div className="flex flex-col pt-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-dfp-stone-700 hover:text-dfp-green-700 hover:bg-dfp-stone-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-dfp-stone-100 mt-2 pt-3 px-4 flex flex-col gap-2">
                {user ? (
                  <Link
                    to="/portal"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-3 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg text-center hover:bg-dfp-green-700 transition-colors cursor-pointer"
                  >
                    Go to Portal
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 text-dfp-stone-700 text-sm font-medium rounded-lg text-center border border-dfp-stone-200 hover:bg-dfp-stone-50 transition-colors cursor-pointer"
                    >
                      Freelancer Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg text-center hover:bg-dfp-green-700 transition-colors cursor-pointer"
                    >
                      Apply to Join
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}