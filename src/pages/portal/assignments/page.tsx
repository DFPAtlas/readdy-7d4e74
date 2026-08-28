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

interface Assignment {
  id: string;
  reference: string;
  title: string;
  project_name: string;
  client_label: string;
  engagement_type: string;
  agreed_rate: number;
  currency: string;
  start_date: string;
  deadline: string;
  status: string;
  scope_summary: string;
  created_at: string;
}

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('assignments')
          .select('*')
          .eq('freelancer_id', profile.id)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setAssignments(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAssignments();
    return () => { cancelled = true; };
  }, [profile]);

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending_setup: { label: 'Setup Pending', color: 'bg-dfp-stone-100 text-dfp-stone-600' },
      awaiting_agreements: { label: 'Awaiting Agreements', color: 'bg-amber-100 text-amber-700' },
      ready_to_start: { label: 'Ready to Start', color: 'bg-dfp-blue-100 text-dfp-blue-700' },
      in_progress: { label: 'In Progress', color: 'bg-dfp-green-100 text-dfp-green-700' },
      paused: { label: 'Paused', color: 'bg-orange-100 text-orange-700' },
      submitted: { label: 'Submitted', color: 'bg-dfp-blue-100 text-dfp-blue-700' },
      under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
      changes_requested: { label: 'Changes Requested', color: 'bg-red-100 text-red-700' },
      approved: { label: 'Approved', color: 'bg-dfp-green-100 text-dfp-green-700' },
      completed: { label: 'Completed', color: 'bg-dfp-green-100 text-dfp-green-700' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
      archived: { label: 'Archived', color: 'bg-dfp-stone-100 text-dfp-stone-400' },
    };
    return map[status] || { label: status.replace(/_/g, ' '), color: 'bg-dfp-stone-100 text-dfp-stone-500' };
  };

  const activeAssignments = assignments.filter((a) => !['completed', 'cancelled', 'archived'].includes(a.status));

  if (profile?.role === 'pending_freelancer') {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dfp-blue-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-hourglass-line text-2xl text-dfp-blue-500"></i>
          </div>
          <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-2">Application Under Review</h2>
          <p className="text-sm text-dfp-stone-500">Assignments become available once your freelancer application is approved.</p>
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
        <div className="mb-6">
          <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Active Assignments</h1>
          <p className="text-sm text-dfp-stone-500 mt-1">{activeAssignments.length} active, {assignments.length} total</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6 flex items-center gap-3">
            <i className="ri-error-warning-line"></i>
            <span>{error}</span>
          </div>
        )}

        {activeAssignments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
            <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-briefcase-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500 mb-3">No active assignments yet.</p>
            <Link to="/portal/opportunities" className="text-sm font-medium text-dfp-green-700 hover:text-dfp-green-800 whitespace-nowrap">Browse available work</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeAssignments.map((assignment) => {
              const statusDisplay = getStatusDisplay(assignment.status);
              const daysRemaining = assignment.deadline
                ? Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <Link
                  key={assignment.id}
                  to={`/portal/assignments/${assignment.id}`}
                  className="block bg-white rounded-xl border border-dfp-stone-200 p-5 hover:border-dfp-green-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        {assignment.reference && (
                          <span className="text-[10px] font-mono font-medium text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{assignment.reference}</span>
                        )}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusDisplay.color}`}>{statusDisplay.label}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-dfp-stone-900 mb-1">{assignment.title}</h3>
                      {assignment.project_name && (
                        <p className="text-xs text-dfp-stone-500 mb-2">{assignment.project_name}{assignment.client_label ? ` — ${assignment.client_label}` : ''}</p>
                      )}
                      {assignment.scope_summary && (
                        <p className="text-xs text-dfp-stone-500 line-clamp-2 mb-2">{assignment.scope_summary}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap text-xs text-dfp-stone-500">
                        {assignment.agreed_rate && (
                          <span>{assignment.currency} {assignment.agreed_rate} / {assignment.engagement_type}</span>
                        )}
                        {assignment.start_date && (
                          <span>Started: {new Date(assignment.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                        {daysRemaining !== null && (
                          <span className={daysRemaining <= 7 ? 'text-red-600 font-medium' : ''}>
                            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-dfp-green-600 font-medium whitespace-nowrap">View Details <i className="ri-arrow-right-line"></i></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}