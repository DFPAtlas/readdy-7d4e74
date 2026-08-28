import { useParams, Link } from 'react-router-dom';
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

const moduleInfo: Record<string, { label: string; phase: string; icon: string; features: string[] }> = {
  work: {
    label: 'Available Work',
    phase: 'Phase 2',
    icon: 'ri-briefcase-4-line',
    features: ['Browse DFP work opportunities', 'Filter by category and skill set', 'View project briefs and requirements', 'Express interest and apply'],
  },
  assignments: {
    label: 'Active Assignments',
    phase: 'Phase 2',
    icon: 'ri-task-line',
    features: ['View accepted assignments', 'Track milestones and deliverables', 'Access project files and briefs', 'Submit completed work'],
  },
  messages: {
    label: 'Messages',
    phase: 'Phase 2',
    icon: 'ri-chat-3-line',
    features: ['Secure project messaging', 'Direct communication with DFP team', 'File sharing in conversations', 'Message notifications'],
  },
  submissions: {
    label: 'Submissions',
    phase: 'Phase 3',
    icon: 'ri-upload-cloud-line',
    features: ['Submit work for review', 'Track submission status', 'Respond to feedback', 'View approval history'],
  },
  timesheets: {
    label: 'Timesheets',
    phase: 'Phase 4',
    icon: 'ri-time-line',
    features: ['Log billable hours', 'Submit timesheets for approval', 'Track approved vs rejected hours', 'View historical timesheets'],
  },
  invoices: {
    label: 'Invoices',
    phase: 'Phase 4',
    icon: 'ri-bill-line',
    features: ['Create invoices from approved work', 'Track invoice status', 'View payment history', 'Download invoice PDFs'],
  },
  payments: {
    label: 'Payments',
    phase: 'Phase 4',
    icon: 'ri-money-pound-circle-line',
    features: ['View payment schedule', 'Track payment status', 'Payment history and summaries', 'Earnings dashboard'],
  },
};

export default function ComingSoonPage() {
  const { module } = useParams<{ module: string }>();
  const { profile } = useAuth();
  const info = moduleInfo[module || ''] || {
    label: module ? module.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'This Module',
    phase: 'a later phase',
    icon: 'ri-tools-line',
    features: ['This feature is planned for a future release.', 'We are building the portal in stages to ensure every feature is secure and tested.'],
  };

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-lg mx-auto py-12">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-dfp-stone-50 border border-dfp-stone-200 flex items-center justify-center mx-auto mb-6">
          <i className={`${info.icon} text-3xl text-dfp-stone-400`}></i>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-2">{info.label}</h1>
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
        <Link to="/portal" className="inline-flex items-center gap-2 px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to Dashboard
        </Link>
      </div>
    </PortalLayout>
  );
}