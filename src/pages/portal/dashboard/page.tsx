import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

interface ApplicationData {
  id: string;
  status: string;
  profile_completion: number;
  submitted_at: string | null;
}

interface AgreementData {
  agreement_type: string;
  accepted: boolean;
}

const pendingSidebar = [
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

const approvedSidebar = [
  { label: 'Dashboard', href: '/portal', icon: 'ri-dashboard-line' },
  { label: 'Available Work', href: '/portal/opportunities', icon: 'ri-briefcase-line' },
  { label: 'My Applications', href: '/portal/applications', icon: 'ri-file-list-3-line' },
  { label: 'Active Assignments', href: '/portal/assignments', icon: 'ri-list-check-3' },
  { label: 'Timesheets', href: '/portal/timesheets', icon: 'ri-time-line' },
  { label: 'Invoices', href: '/portal/invoices', icon: 'ri-bill-line' },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

export default function FreelancerDashboard() {
  const { profile } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [agreements, setAgreements] = useState<AgreementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 2 counts for approved freelancers
  const [counts, setCounts] = useState({ opportunities: 0, applications: 0, assignments: 0 });

  const isPending = profile?.role === 'pending_freelancer';
  const sidebarItems = isPending ? pendingSidebar : approvedSidebar;

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [appRes, agreeRes] = await Promise.all([
          supabase.from('freelancer_applications').select('*').eq('user_id', profile.id).maybeSingle(),
          supabase.from('freelancer_agreements').select('*').eq('user_id', profile.id),
        ]);

        if (cancelled) return;
        if (appRes.error) throw appRes.error;
        if (agreeRes.error) throw agreeRes.error;

        setApplication(appRes.data);
        setAgreements(agreeRes.data || []);

        // Phase 2: fetch marketplace counts for approved freelancers
        if (profile.role === 'freelancer') {
          const [oppRes, appCountRes, assignRes] = await Promise.all([
            supabase.from('work_opportunities').select('id', { count: 'exact', head: true }).eq('status', 'published'),
            supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }).eq('freelancer_id', profile.id),
            supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('freelancer_id', profile.id).not('status', 'in', '("completed","cancelled","archived")'),
          ]);
          if (!cancelled) {
            setCounts({
              opportunities: oppRes.count || 0,
              applications: appCountRes.count || 0,
              assignments: assignRes.count || 0,
            });
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [profile]);

  if (loading) {
    return (
      <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer">Retry</button>
        </div>
      </PortalLayout>
    );
  }

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: string }> = {
      draft: { label: 'Draft', color: 'bg-dfp-stone-100 text-dfp-stone-600', icon: 'ri-draft-line' },
      submitted: { label: 'Submitted', color: 'bg-dfp-blue-100 text-dfp-blue-700', icon: 'ri-send-plane-line' },
      under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: 'ri-search-eye-line' },
      more_info: { label: 'More Information Required', color: 'bg-orange-100 text-orange-700', icon: 'ri-question-line' },
      approved: { label: 'Approved', color: 'bg-dfp-green-100 text-dfp-green-700', icon: 'ri-check-double-line' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: 'ri-close-circle-line' },
      suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', icon: 'ri-forbid-line' },
    };
    return map[status] || { label: status, color: 'bg-dfp-stone-100 text-dfp-stone-600', icon: 'ri-information-line' };
  };

  const statusDisplay = application ? getStatusDisplay(application.status) : getStatusDisplay('draft');

  const getAgreementStatus = (type: string) => {
    const a = agreements.find((ag) => ag.agreement_type === type);
    return a?.accepted || false;
  };

  const checklist = [
    { label: 'Email verified', done: true, href: '/verify-email' },
    { label: 'Personal details completed', done: (application?.profile_completion || 0) >= 15, href: '/portal/application?step=1' },
    { label: 'Business details completed', done: (application?.profile_completion || 0) >= 30, href: '/portal/application?step=2' },
    { label: 'Skills and experience added', done: (application?.profile_completion || 0) >= 45, href: '/portal/application?step=3' },
    { label: 'Availability and rates set', done: (application?.profile_completion || 0) >= 60, href: '/portal/application?step=4' },
    { label: 'Portfolio items added', done: (application?.profile_completion || 0) >= 75, href: '/portal/application?step=5' },
    { label: 'Documents uploaded', done: (application?.profile_completion || 0) >= 85, href: '/portal/application?step=6' },
    { label: 'Agreements accepted', done: getAgreementStatus('privacy_notice') && getAgreementStatus('freelancer_terms'), href: '/portal/application?step=7' },
  ];

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">
            Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}
          </h1>
          <p className="text-sm text-dfp-stone-500 mt-1">
            {isPending ? 'Complete your application to join the DFP Freelancer Network.' : 'You are an approved DFP freelancer.'}
          </p>
        </div>

        {/* Status card */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusDisplay.color} bg-opacity-20`}>
                <i className={`${statusDisplay.icon} text-xl`}></i>
              </div>
              <div>
                <p className="text-xs text-dfp-stone-500 uppercase tracking-wider">Application Status</p>
                <p className={`text-sm font-semibold mt-0.5 ${statusDisplay.color.split(' ')[1]}`}>{statusDisplay.label}</p>
              </div>
            </div>
            {isPending && application?.status === 'draft' && (
              <Link
                to="/portal/application"
                className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Continue Application
              </Link>
            )}
            {application?.status === 'more_info' && (
              <Link
                to="/portal/application"
                className="px-5 py-2.5 bg-dfp-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-blue-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Update Application
              </Link>
            )}
          </div>

          {/* Progress bar */}
          {isPending && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dfp-stone-500">Profile Completion</span>
                <span className="text-xs font-semibold text-dfp-stone-700">{application?.profile_completion || 0}%</span>
              </div>
              <div className="w-full h-2 bg-dfp-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dfp-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${application?.profile_completion || 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Onboarding checklist - pending only */}
        {isPending && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
            <h2 className="font-display text-base font-semibold text-dfp-stone-900 mb-4">Onboarding Checklist</h2>
            <div className="space-y-1">
              {checklist.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-dfp-stone-50 transition-colors cursor-pointer"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? 'bg-dfp-green-100' : 'bg-dfp-stone-100'
                  }`}>
                    <i className={`text-xs ${item.done ? 'ri-check-line text-dfp-green-600' : 'ri-time-line text-dfp-stone-400'}`}></i>
                  </div>
                  <span className={`text-sm flex-1 ${item.done ? 'text-dfp-stone-600' : 'text-dfp-stone-400'}`}>{item.label}</span>
                  {!item.done && (
                    <span className="text-xs text-dfp-green-600 font-medium">Complete</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Approved freelancer dashboard */}
        {!isPending && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Link to="/portal/opportunities" className="bg-white rounded-xl border border-dfp-stone-200 p-5 hover:border-dfp-green-300 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-dfp-blue-50 text-dfp-blue-600 flex items-center justify-center mb-3">
                <i className="ri-briefcase-line text-lg"></i>
              </div>
              <p className="text-2xl font-bold text-dfp-stone-900">{counts.opportunities}</p>
              <p className="text-xs text-dfp-stone-500 mt-0.5">Available Opportunities</p>
            </Link>
            <Link to="/portal/applications" className="bg-white rounded-xl border border-dfp-stone-200 p-5 hover:border-dfp-green-300 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <i className="ri-file-list-3-line text-lg"></i>
              </div>
              <p className="text-2xl font-bold text-dfp-stone-900">{counts.applications}</p>
              <p className="text-xs text-dfp-stone-500 mt-0.5">My Applications</p>
            </Link>
            <Link to="/portal/assignments" className="bg-white rounded-xl border border-dfp-stone-200 p-5 hover:border-dfp-green-300 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-dfp-green-50 text-dfp-green-600 flex items-center justify-center mb-3">
                <i className="ri-list-check-3 text-lg"></i>
              </div>
              <p className="text-2xl font-bold text-dfp-stone-900">{counts.assignments}</p>
              <p className="text-xs text-dfp-stone-500 mt-0.5">Active Assignments</p>
            </Link>
          </div>
        )}

        {/* Phase notice */}
        <div className="bg-dfp-blue-50 border border-dfp-blue-100 rounded-xl p-4 md:p-5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-dfp-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="ri-information-line text-dfp-blue-600 text-sm"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-dfp-blue-800 mb-1">Phase 4 is now live — All systems operational</p>
              <p className="text-xs text-dfp-blue-600 leading-relaxed">
                {isPending
                  ? 'Complete your application first. Work opportunities, assignments, timesheets, invoicing, and collaboration tools will be available after approval.'
                  : 'All features are live: marketplace, assignments, tasks, messaging, submissions, timesheets, invoicing, payments, and earnings. The full DFP Freelancer Network is operational.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}