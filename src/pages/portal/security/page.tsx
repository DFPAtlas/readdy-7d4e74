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

export default function SecurityPage() {
  const { profile } = useAuth();

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-6">Security Settings</h1>
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dfp-stone-900">Email Address</p>
              <p className="text-xs text-dfp-stone-500">{profile?.email}</p>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-dfp-green-100 text-dfp-green-700">Verified</span>
          </div>
          <hr className="border-dfp-stone-100" />
          <div>
            <p className="text-sm font-medium text-dfp-stone-900 mb-1">Change Password</p>
            <p className="text-xs text-dfp-stone-500 mb-3">Use the password reset flow to change your password. A reset link will be sent to your email.</p>
            <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium text-dfp-blue-600 hover:text-dfp-blue-700 cursor-pointer">
              <i className="ri-lock-line"></i> Reset Password
            </Link>
          </div>
          <hr className="border-dfp-stone-100" />
          <div>
            <p className="text-sm font-medium text-dfp-stone-900 mb-1">Two-Factor Authentication</p>
            <p className="text-xs text-dfp-stone-500">Two-factor authentication will be available in a future update.</p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}