import { Link } from 'react-router-dom';

const footerLinks = {
  'Digital Footprint': [
    { label: 'About DFP', href: 'https://digital-footprint.uk', external: true },
    { label: 'Main Website', href: 'https://digital-footprint.uk', external: true },
    { label: 'Freelancer Network', href: '/' },
  ],
  'Legal': [
    { label: 'Privacy Notice', href: '/privacy' },
    { label: 'Freelancer Terms', href: '/freelancer-terms' },
    { label: 'Contractor Notice', href: '/freelancer-terms' },
  ],
  'Support': [
    { label: 'Security', href: '/security' },
    { label: 'FAQs', href: '/faq' },
    { label: 'Contact Support', href: 'mailto:support@digital-footprint.uk', external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-dfp-blue-900 pt-14 md:pt-18 pb-8 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <i className="ri-shield-check-line text-white text-lg"></i>
              </div>
              <span className="font-display font-semibold text-base">DFP Freelancer Network</span>
            </div>
            <p className="text-sm text-dfp-blue-200 leading-relaxed mb-5">
              A secure freelancer portal by Digital Footprint. Connecting skilled professionals with approved digital projects.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://digital-footprint.uk" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer" aria-label="DFP Website">
                <i className="ri-global-line text-white/80 text-sm"></i>
              </a>
              <a href="mailto:support@digital-footprint.uk" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer" aria-label="Email Support">
                <i className="ri-mail-line text-white/80 text-sm"></i>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display font-semibold text-sm mb-4 text-white">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-dfp-blue-200 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-dfp-blue-200 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dfp-blue-300">
            &copy; {new Date().getFullYear()} Digital Footprint. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-xs text-dfp-blue-300 hover:text-white transition-colors">Privacy</Link>
            <Link to="/freelancer-terms" className="text-xs text-dfp-blue-300 hover:text-white transition-colors">Terms</Link>
            <Link to="/security" className="text-xs text-dfp-blue-300 hover:text-white transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}