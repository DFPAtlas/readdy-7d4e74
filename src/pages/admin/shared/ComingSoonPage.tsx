import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import PortalLayout from '@/components/feature/PortalLayout';

const adminSidebar = [
  { label: 'Overview', href: '/admin', icon: 'ri-dashboard-line' },
  { label: 'Applications', href: '/admin/applications', icon: 'ri-file-list-3-line' },
  { label: 'Freelancers', href: '/admin/freelancers', icon: 'ri-user-line', comingSoon: true },
  { label: 'Documents', href: '/admin/documents', icon: 'ri-folder-line', comingSoon: true },
  { label: 'Compliance', href: '/admin/compliance', icon: 'ri-shield-check-line', comingSoon: true },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
];

const phaseInfo: Record<string, { phase: string; features: string[]; icon: string }> = {
  'Freelancers': {
    phase: 'Phase 2',
    icon: 'ri-user-search-line',
    features: ['Approved freelancer directory', 'Search and filter by category', 'Profile and document review', 'Activity and assignment history'],
  },
  'Document Review': {
    phase: 'Phase 2',
    icon: 'ri-file-search-line',
    features: ['Document verification workflow', 'Approve or reject documents', 'Expiry date tracking', 'Bulk document review'],
  },
  'Compliance': {
    phase: 'Phase 3',
    icon: 'ri-check-double-line',
    features: ['Security induction tracking', 'Agreement status overview', 'Insurance and certification expiry alerts', 'Compliance audit reports'],
  },
  'Audit Log': {
    phase: 'Phase 3',
    icon: 'ri-history-line',
    features: ['Full audit trail viewer', 'Filter by actor, action, and entity', 'Export audit data', 'Anomaly detection'],
  },
  'Settings': {
    phase: 'Phase 3',
    icon: 'ri-settings-3-line',
    features: ['Portal configuration', 'Category and skill management', 'Notification preferences', 'Billing and rate settings'],
  },
};

export default function AdminComingSoon({ title = 'This Page' }: { title?: string }) {
  const { profile } = useAuth();
  const info = phaseInfo[title] || { phase: 'a later phase', icon: 'ri-tools-line', features: ['This module is under development.'] };

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-lg mx-auto py-12">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-dfp-stone-50 border border-dfp-stone-200 flex items-center justify-center mx-auto mb-6">
          <i className={`${info.icon} text-3xl text-dfp-stone-400`}></i>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-2">{title}</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dfp-stone-100 text-xs font-medium text-dfp-stone-600">
            <div className="w-1.5 h-1.5 rounded-full bg-dfp-green-500"></div>
            Coming in {info.phase}
          </span>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 mb-6">
          <h2 className="text-xs font-semibold text-dfp-stone-500 uppercase tracking-wider mb-3">Planned Features</h2>
          <ul className="space-y-2.5">
            {info.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-dfp-stone-100 flex items-center justify-center flex-shrink-0 mt-px">
                  <i className="ri-check-line text-[10px] text-dfp-stone-500"></i>
                </div>
                <span className="text-sm text-dfp-stone-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link to="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to Admin Overview
        </Link>
      </div>
    </PortalLayout>
  );
}