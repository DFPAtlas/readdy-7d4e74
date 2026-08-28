import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';
import TasksTab from '@/pages/portal/assignments/[id]/components/TasksTab';
import MilestonesTab from '@/pages/portal/assignments/[id]/components/MilestonesTab';
import MessagesTab from '@/pages/portal/assignments/[id]/components/MessagesTab';
import SubmissionsTab from '@/pages/portal/assignments/[id]/components/SubmissionsTab';
import ActivityTab from '@/pages/portal/assignments/[id]/components/ActivityTab';

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

interface Assignment {
  id: string;
  reference: string;
  title: string;
  description: string;
  project_name: string;
  client_label: string;
  freelancer_id: string;
  project_manager_id: string;
  engagement_type: string;
  agreed_rate: number;
  currency: string;
  deliverables: any[];
  milestones: any[];
  start_date: string;
  deadline: string;
  estimated_hours: number;
  scope_summary: string;
  special_terms: string;
  status: string;
  agreement_accepted: boolean;
  completed_at: string;
  completion_summary: string;
  invoice_eligible: boolean;
  created_at: string;
}

const tabs = ['Overview', 'Tasks', 'Milestones', 'Messages', 'Submissions', 'Activity'];

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  const isStaff = profile?.role && ['super_admin','dfp_admin','project_manager','finance'].includes(profile.role);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) { setError('Assignment not found'); return; }
        setAssignment(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAssignment();
    return () => { cancelled = true; };
  }, [id]);

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

  if (loading) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !assignment) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{error || 'Assignment not found'}</p>
          <Link to="/portal/assignments" className="text-sm font-medium text-dfp-green-700">Back to assignments</Link>
        </div>
      </PortalLayout>
    );
  }

  const statusDisplay = getStatusDisplay(assignment.status);
  const daysRemaining = assignment.deadline
    ? Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
      <div className="max-w-5xl mx-auto">
        <Link to="/portal/assignments" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to assignments
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                {assignment.reference && (
                  <span className="text-[10px] font-mono font-medium text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{assignment.reference}</span>
                )}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusDisplay.color}`}>{statusDisplay.label}</span>
                {assignment.invoice_eligible && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-dfp-green-100 text-dfp-green-700">Invoice Eligible</span>
                )}
              </div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900 mb-1">{assignment.title}</h1>
              <p className="text-sm text-dfp-stone-500">{assignment.project_name}{assignment.client_label ? ` — ${assignment.client_label}` : ''}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {assignment.agreed_rate && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400">Agreed Rate</p>
                  <p className="text-sm font-semibold text-dfp-stone-900">{assignment.currency} {assignment.agreed_rate} / {assignment.engagement_type}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-dfp-stone-100">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Start Date</p>
              <p className="text-sm font-medium text-dfp-stone-700">{assignment.start_date ? new Date(assignment.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Deadline</p>
              <p className="text-sm font-medium text-dfp-stone-700">{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Days Remaining</p>
              <p className={`text-sm font-medium ${daysRemaining !== null && daysRemaining <= 7 ? 'text-red-600' : 'text-dfp-stone-700'}`}>
                {daysRemaining !== null ? `${daysRemaining} days` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Est. Hours</p>
              <p className="text-sm font-medium text-dfp-stone-700">{assignment.estimated_hours || '—'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-dfp-green-600 text-white'
                  : 'bg-white text-dfp-stone-500 hover:bg-dfp-stone-50 border border-dfp-stone-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {assignment.scope_summary && (
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
                <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Scope</h2>
                <p className="text-sm text-dfp-stone-600 leading-relaxed whitespace-pre-line">{assignment.scope_summary}</p>
              </div>
            )}

            {assignment.description && (
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
                <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Description</h2>
                <p className="text-sm text-dfp-stone-600 leading-relaxed whitespace-pre-line">{assignment.description}</p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
              <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Deliverables</h2>
              {(assignment.deliverables || []).length === 0 ? (
                <p className="text-sm text-dfp-stone-400">No deliverables defined yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(assignment.deliverables as any[]).map((d: any, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-dfp-stone-600">
                      <i className="ri-checkbox-blank-circle-fill text-[6px] text-dfp-green-500 mt-1.5 flex-shrink-0"></i>
                      <span>{typeof d === 'string' ? d : d.title || d.name || JSON.stringify(d)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
              <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Milestones</h2>
              {(assignment.milestones || []).length === 0 ? (
                <p className="text-sm text-dfp-stone-400">No milestones defined yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(assignment.milestones as any[]).map((m: any, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-dfp-stone-600">
                      <i className="ri-flag-line text-dfp-blue-500 mt-0.5 flex-shrink-0"></i>
                      <span>{typeof m === 'string' ? m : m.title || m.name || JSON.stringify(m)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {assignment.special_terms && (
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
                <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Special Terms</h2>
                <p className="text-sm text-dfp-stone-600 leading-relaxed whitespace-pre-line">{assignment.special_terms}</p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
              <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Agreement Status</h2>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${assignment.agreement_accepted ? 'bg-dfp-green-100' : 'bg-amber-100'}`}>
                  <i className={`text-sm ${assignment.agreement_accepted ? 'ri-check-line text-dfp-green-600' : 'ri-time-line text-amber-600'}`}></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-dfp-stone-700">
                    {assignment.agreement_accepted ? 'Agreement Accepted' : 'Agreement Pending'}
                  </p>
                  {assignment.agreement_accepted_at && (
                    <p className="text-xs text-dfp-stone-400">Accepted {new Date(assignment.agreement_accepted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Tasks' && (
          <TasksTab assignmentId={assignment.id} isStaff={!!isStaff} />
        )}

        {activeTab === 'Milestones' && (
          <MilestonesTab assignmentId={assignment.id} isStaff={!!isStaff} />
        )}

        {activeTab === 'Messages' && (
          <MessagesTab
            assignmentId={assignment.id}
            currentUserId={profile?.id || ''}
            currentUserName={profile?.first_name || 'User'}
          />
        )}

        {activeTab === 'Submissions' && (
          <SubmissionsTab
            assignmentId={assignment.id}
            currentUserId={profile?.id || ''}
            isStaff={!!isStaff}
          />
        )}

        {activeTab === 'Activity' && (
          <ActivityTab assignmentId={assignment.id} />
        )}


      </div>
    </PortalLayout>
  );
}