import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

const approvedSidebar = [
  { label: 'Dashboard', href: '/portal', icon: 'ri-dashboard-line' },
  { label: 'Available Work', href: '/portal/opportunities', icon: 'ri-briefcase-line' },
  { label: 'My Applications', href: '/portal/applications', icon: 'ri-file-list-3-line' },
  { label: 'Active Assignments', href: '/portal/assignments', icon: 'ri-list-check-3' },
  { label: 'Messages', href: '/portal/coming-soon/messages', icon: 'ri-message-3-line', comingSoon: true },
  { label: 'Timesheets', href: '/portal/coming-soon/timesheets', icon: 'ri-time-line', comingSoon: true },
  { label: 'Invoices', href: '/portal/coming-soon/invoices', icon: 'ri-bill-line', comingSoon: true },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

interface Application {
  id: string;
  opportunity_id: string;
  cover_letter: string;
  proposed_rate: number;
  rate_type: string;
  currency: string;
  availability_notes: string;
  status: string;
  submitted_at: string;
  reviewed_at: string;
  review_notes: string;
  opportunity: {
    id: string;
    title: string;
    project_name: string;
    client_label: string;
    category: string;
    engagement_type: string;
    budget_range: string;
    status: string;
  } | null;
}

export default function ApplicationsPage() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const fetchApps = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('opportunity_applications')
          .select('*')
          .eq('freelancer_id', profile.id)
          .order('submitted_at', { ascending: false });

        if (cancelled) return;
        if (fetchError) throw fetchError;

        const apps = data || [];
        if (apps.length > 0) {
          const oppIds = [...new Set(apps.map((a: any) => a.opportunity_id))];
          const { data: opps } = await supabase
            .from('work_opportunities')
            .select('id, title, project_name, client_label, category, engagement_type, budget_range, status')
            .in('id', oppIds);

          if (!cancelled) {
            const oppMap: Record<string, any> = {};
            (opps || []).forEach((o: any) => { oppMap[o.id] = o; });
            setApplications(apps.map((a: any) => ({ ...a, opportunity: oppMap[a.opportunity_id] || null })));
          }
        } else {
          setApplications([]);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchApps();
    return () => { cancelled = true; };
  }, [profile]);

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: string }> = {
      submitted: { label: 'Submitted', color: 'bg-dfp-blue-100 text-dfp-blue-700', icon: 'ri-send-plane-line' },
      under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: 'ri-search-eye-line' },
      shortlisted: { label: 'Shortlisted', color: 'bg-dfp-green-100 text-dfp-green-700', icon: 'ri-star-line' },
      accepted: { label: 'Accepted', color: 'bg-dfp-green-100 text-dfp-green-700', icon: 'ri-check-double-line' },
      declined: { label: 'Not Selected', color: 'bg-red-100 text-red-700', icon: 'ri-close-circle-line' },
      withdrawn: { label: 'Withdrawn', color: 'bg-dfp-stone-100 text-dfp-stone-500', icon: 'ri-arrow-go-back-line' },
      expired: { label: 'Expired', color: 'bg-dfp-stone-100 text-dfp-stone-400', icon: 'ri-time-line' },
    };
    return map[status] || { label: status, color: 'bg-dfp-stone-100 text-dfp-stone-500', icon: 'ri-information-line' };
  };

  const statuses = ['submitted', 'under_review', 'shortlisted', 'accepted', 'declined', 'withdrawn'];
  const filtered = statusFilter === 'all' ? applications : applications.filter((a) => a.status === statusFilter);

  if (profile?.role === 'pending_freelancer') {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dfp-blue-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-hourglass-line text-2xl text-dfp-blue-500"></i>
          </div>
          <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-2">Application Under Review</h2>
          <p className="text-sm text-dfp-stone-500">Your work applications will appear here once your freelancer account is approved.</p>
        </div>
      </PortalLayout>
    );
  }

  if (loading) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">My Applications</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''} submitted</p>
          </div>
          <Link
            to="/portal/opportunities"
            className="px-4 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Browse Opportunities
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6 flex items-center gap-3">
            <i className="ri-error-warning-line"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Status filter pills */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${statusFilter === 'all' ? 'bg-dfp-stone-800 text-white' : 'bg-dfp-stone-100 text-dfp-stone-600 hover:bg-dfp-stone-200'}`}
          >
            All ({applications.length})
          </button>
          {statuses.map((s) => {
            const count = applications.filter((a) => a.status === s).length;
            if (count === 0) return null;
            const display = getStatusDisplay(s);
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${statusFilter === s ? 'bg-dfp-stone-800 text-white' : 'bg-dfp-stone-100 text-dfp-stone-600 hover:bg-dfp-stone-200'}`}
              >
                {display.label} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
            <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-inbox-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500 mb-3">
              {applications.length === 0 ? 'You haven\'t applied to any opportunities yet.' : 'No applications match this filter.'}
            </p>
            {applications.length === 0 && (
              <Link to="/portal/opportunities" className="text-sm font-medium text-dfp-green-700 hover:text-dfp-green-800">Browse available work</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const statusDisplay = getStatusDisplay(app.status);
              return (
                <Link
                  key={app.id}
                  to={app.opportunity ? `/portal/opportunities/${app.opportunity.id}` : '#'}
                  className="block bg-white rounded-xl border border-dfp-stone-200 p-4 hover:border-dfp-green-200 transition cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-dfp-stone-900 truncate">
                          {app.opportunity?.title || 'Unknown Opportunity'}
                        </h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusDisplay.color}`}>
                          <i className={`${statusDisplay.icon} mr-1 text-[10px]`}></i>
                          {statusDisplay.label}
                        </span>
                      </div>
                      {app.opportunity && (
                        <p className="text-xs text-dfp-stone-500">{app.opportunity.project_name} — {app.opportunity.client_label}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-dfp-stone-400">
                        {app.proposed_rate && (
                          <span>Proposed: {app.currency} {app.proposed_rate}/{app.rate_type}</span>
                        )}
                        <span>Applied: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {app.opportunity && (
                        <span className="text-xs text-dfp-green-600 font-medium whitespace-nowrap">View Details <i className="ri-arrow-right-line"></i></span>
                      )}
                    </div>
                  </div>
                  {app.review_notes && (
                    <div className="mt-3 pt-3 border-t border-dfp-stone-50">
                      <p className="text-xs text-dfp-stone-400 mb-0.5">Reviewer feedback:</p>
                      <p className="text-xs text-dfp-stone-600">{app.review_notes}</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}