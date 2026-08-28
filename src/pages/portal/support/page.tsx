import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import PortalLayout from '@/components/feature/PortalLayout';

const sidebarItems = [
  { label: 'Dashboard', href: '/portal', icon: 'ri-dashboard-line' },
  { label: 'Application', href: '/portal/application', icon: 'ri-file-list-3-line' },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Skills', href: '/portal/skills', icon: 'ri-award-line' },
  { label: 'Portfolio', href: '/portal/portfolio', icon: 'ri-briefcase-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Agreements', href: '/portal/agreements', icon: 'ri-file-text-line' },
  { label: 'Security', href: '/portal/security', icon: 'ri-shield-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

const supportArticles = [
  { q: 'How long does the application review take?', a: 'Most applications are reviewed within 5 working days. You will be notified by email and in the portal when there is an update.' },
  { q: 'What documents do I need to submit?', a: 'At minimum, you need a CV and proof of identity. Additional documents like professional certificates, insurance, and company evidence may be required depending on your category.' },
  { q: 'How do I update my profile after submission?', a: 'You can update most profile fields through the application wizard. After submission, some fields may be locked — contact support if you need to change locked information.' },
  { q: 'Who do I contact for urgent help?', a: 'For portal access issues, email support@digital-footprint.uk. For application-specific questions, use the contact information provided in your review communications.' },
];

export default function SupportPage() {
  const { profile } = useAuth();

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-2">Support</h1>
        <p className="text-sm text-dfp-stone-500 mb-6">Find answers to common questions or get in touch with the DFP team.</p>

        <div className="space-y-3 mb-8">
          {supportArticles.map((article) => (
            <div key={article.q} className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-dfp-stone-900 mb-1">{article.q}</h3>
              <p className="text-sm text-dfp-stone-600 leading-relaxed">{article.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-dfp-blue-50 border border-dfp-blue-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-dfp-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="ri-mail-line text-dfp-blue-600"></i>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dfp-blue-800 mb-1">Still need help?</h3>
              <p className="text-xs text-dfp-blue-600 mb-3">Contact the DFP support team and we will get back to you within 2 working days.</p>
              <a href="mailto:support@digital-footprint.uk" className="inline-flex items-center gap-1.5 text-sm font-medium text-dfp-blue-700 hover:text-dfp-blue-800 cursor-pointer">
                <i className="ri-send-plane-line"></i> support@digital-footprint.uk
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/faq" className="text-sm text-dfp-stone-500 hover:text-dfp-stone-700 cursor-pointer"><i className="ri-question-line mr-1"></i> Full FAQ</Link>
          <Link to="/security" className="text-sm text-dfp-stone-500 hover:text-dfp-stone-700 cursor-pointer"><i className="ri-shield-line mr-1"></i> Security Info</Link>
          <Link to="/privacy" className="text-sm text-dfp-stone-500 hover:text-dfp-stone-700 cursor-pointer"><i className="ri-file-text-line mr-1"></i> Privacy Notice</Link>
        </div>
      </div>
    </PortalLayout>
  );
}