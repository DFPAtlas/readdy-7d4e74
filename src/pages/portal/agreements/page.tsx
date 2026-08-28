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

export default function AgreementsPage() {
  const { profile } = useAuth();

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-dfp-blue-50 flex items-center justify-center mx-auto mb-4">
          <i className="ri-file-text-line text-2xl text-dfp-blue-600"></i>
        </div>
        <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-2">Agreements</h1>
        <p className="text-sm text-dfp-stone-500 mb-6 max-w-md mx-auto">
          Review and accept your privacy notice, freelancer terms, and other required agreements through the application wizard.
        </p>
        <Link to="/portal/application?step=7" className="inline-flex items-center gap-2 px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer">
          <i className="ri-arrow-right-line"></i> Go to Agreements (Step 7)
        </Link>
      </div>
    </PortalLayout>
  );
}