import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';
import TasksTab from '@/pages/portal/assignments/[id]/components/TasksTab';
import MilestonesTab from '@/pages/portal/assignments/[id]/components/MilestonesTab';
import MessagesTab from '@/pages/portal/assignments/[id]/components/MessagesTab';
import SubmissionsTab from '@/pages/portal/assignments/[id]/components/SubmissionsTab';
import ActivityTab from '@/pages/portal/assignments/[id]/components/ActivityTab';

const adminSidebar = [
  { label: 'Overview', href: '/admin', icon: 'ri-dashboard-line' },
  { label: 'Applications', href: '/admin/applications', icon: 'ri-file-list-3-line' },
  { label: 'Opportunities', href: '/admin/opportunities', icon: 'ri-briefcase-line' },
  { label: 'Applications Review', href: '/admin/opportunity-applications', icon: 'ri-user-star-line' },
  { label: 'Invitations', href: '/admin/invitations', icon: 'ri-mail-send-line' },
  { label: 'Assignments', href: '/admin/assignments', icon: 'ri-list-check-3' },
  { label: 'Freelancers', href: '/admin/freelancers', icon: 'ri-user-line', comingSoon: true },
  { label: 'Documents', href: '/admin/documents', icon: 'ri-folder-line', comingSoon: true },
  { label: 'Compliance', href: '/admin/compliance', icon: 'ri-shield-check-line', comingSoon: true },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
];

const tabs = ['Overview', 'Tasks', 'Milestones', 'Messages', 'Submissions', 'Activity'];

export default function AdminAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<any>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle();
        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) { setError('Assignment not found'); return; }
        setAssignment(data);

        const { data: fp } = await supabase.from('profiles').select('id, first_name, last_name, email').eq('id', data.freelancer_id).maybeSingle();
        if (!cancelled) setFreelancerProfile(fp);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSaving(true);
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = profile?.id;
        updates.invoice_eligible = true;
      }
      const { error: updateError } = await supabase.from('assignments').update(updates).eq('id', id);
      if (updateError) throw updateError;
      setAssignment((prev: any) => ({ ...prev, ...updates }));
      setSaveMsg(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending_setup: 'bg-dfp-stone-100 text-dfp-stone-600',
      awaiting_agreements: 'bg-amber-100 text-amber-700',
      ready_to_start: 'bg-dfp-blue-100 text-dfp-blue-700',
      in_progress: 'bg-dfp-green-100 text-dfp-green-700',
      paused: 'bg-orange-100 text-orange-700',
      submitted: 'bg-dfp-blue-100 text-dfp-blue-700',
      under_review: 'bg-amber-100 text-amber-700',
      changes_requested: 'bg-red-100 text-red-700',
      approved: 'bg-dfp-green-100 text-dfp-green-700',
      completed: 'bg-dfp-green-100 text-dfp-green-700',
      cancelled: 'bg-red-100 text-red-700',
      archived: 'bg-dfp-stone-50 text-dfp-stone-400',
    };
    return map[status] || 'bg-dfp-stone-100 text-dfp-stone-500';
  };

  if (loading) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>
      </PortalLayout>
    );
  }

  if (error || !assignment) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-dfp-stone-600 mb-4">{error || 'Assignment not found'}</p>
          <Link to="/admin/assignments" className="text-sm font-medium text-dfp-green-700">Back to assignments</Link>
        </div>
      </PortalLayout>
    );
  }

  const daysRemaining = assignment.deadline
    ? Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-5xl mx-auto">
        <Link to="/admin/assignments" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to assignments
        </Link>

        {saveMsg && <div className="p-3 bg-dfp-green-50 border border-dfp-green-100 rounded-lg text-sm text-dfp-green-700 mb-4">{saveMsg}</div>}

        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                {assignment.reference && <span className="text-[10px] font-mono text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{assignment.reference}</span>}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusBadge(assignment.status)}`}>{assignment.status.replace(/_/g, ' ')}</span>
                {assignment.invoice_eligible && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-dfp-green-100 text-dfp-green-700">Invoice Eligible</span>}
              </div>
              <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-1">{assignment.title}</h1>
              <p className="text-sm text-dfp-stone-500">{assignment.project_name}{assignment.client_label ? ` — ${assignment.client_label}` : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-dfp-stone-100">
            <div><p className="text-[10px] uppercase text-dfp-stone-400 mb-0.5">Freelancer</p><p className="text-sm font-medium text-dfp-stone-700">{freelancerProfile?.first_name} {freelancerProfile?.last_name}</p></div>
            <div><p className="text-[10px] uppercase text-dfp-stone-400 mb-0.5">Rate</p><p className="text-sm font-medium text-dfp-stone-700">{assignment.agreed_rate ? `${assignment.currency} ${assignment.agreed_rate} / ${assignment.engagement_type}` : '—'}</p></div>
            <div><p className="text-[10px] uppercase text-dfp-stone-400 mb-0.5">Deadline</p><p className="text-sm font-medium text-dfp-stone-700">{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p></div>
            <div><p className="text-[10px] uppercase text-dfp-stone-400 mb-0.5">Days Left</p><p className={`text-sm font-medium ${daysRemaining !== null && daysRemaining <= 7 ? 'text-red-600' : 'text-dfp-stone-700'}`}>{daysRemaining !== null ? daysRemaining : '—'}</p></div>
          </div>
        </div>

        {/* Status actions */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 mb-6">
          <p className="text-xs font-medium text-dfp-stone-500 mb-3">Update Status</p>
          <div className="flex items-center gap-2 flex-wrap">
            {['pending_setup', 'ready_to_start', 'in_progress', 'paused', 'approved', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={saving || assignment.status === s}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize cursor-pointer whitespace-nowrap ${assignment.status === s ? 'bg-dfp-stone-800 text-white' : 'bg-dfp-stone-100 text-dfp-stone-600 hover:bg-dfp-stone-200'} disabled:opacity-50`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
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
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-5">
                <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Scope</h2>
                <p className="text-sm text-dfp-stone-600 whitespace-pre-line">{assignment.scope_summary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-5">
                <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Deliverables</h2>
                {(assignment.deliverables || []).length === 0 ? (
                  <p className="text-sm text-dfp-stone-400">No deliverables defined.</p>
                ) : (
                  <ul className="space-y-1.5">{(assignment.deliverables as any[]).map((d: any, i: number) => <li key={i} className="text-sm text-dfp-stone-600 flex items-start gap-2"><i className="ri-checkbox-blank-circle-fill text-[6px] text-dfp-green-500 mt-1.5"></i>{typeof d === 'string' ? d : d.title || ''}</li>)}</ul>
                )}
              </div>
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-5">
                <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Milestones (JSONB)</h2>
                {(assignment.milestones || []).length === 0 ? (
                  <p className="text-sm text-dfp-stone-400">No milestones defined in assignment.</p>
                ) : (
                  <ul className="space-y-1.5">{(assignment.milestones as any[]).map((m: any, i: number) => <li key={i} className="text-sm text-dfp-stone-600 flex items-start gap-2"><i className="ri-flag-line text-dfp-blue-500 mt-0.5"></i>{typeof m === 'string' ? m : m.title || ''}</li>)}</ul>
                )}
              </div>
            </div>

            {freelancerProfile && (
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-5">
                <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Freelancer</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dfp-green-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-dfp-green-700">{freelancerProfile.first_name?.[0]}{freelancerProfile.last_name?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dfp-stone-900">{freelancerProfile.first_name} {freelancerProfile.last_name}</p>
                    <p className="text-xs text-dfp-stone-400">{freelancerProfile.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Tasks' && (
          <TasksTab assignmentId={assignment.id} isStaff={true} />
        )}

        {activeTab === 'Milestones' && (
          <MilestonesTab assignmentId={assignment.id} isStaff={true} />
        )}

        {activeTab === 'Messages' && (
          <MessagesTab
            assignmentId={assignment.id}
            currentUserId={profile?.id || ''}
            currentUserName={profile?.first_name || 'Admin'}
          />
        )}

        {activeTab === 'Submissions' && (
          <SubmissionsTab
            assignmentId={assignment.id}
            currentUserId={profile?.id || ''}
            isStaff={true}
          />
        )}

        {activeTab === 'Activity' && (
          <ActivityTab assignmentId={assignment.id} />
        )}

        <div className="mt-8 bg-dfp-blue-50 border border-dfp-blue-100 rounded-xl p-4">
          <p className="text-sm text-dfp-blue-700">
            Phase 3 delivery tools are now active. Timesheets, invoicing, and payments will be available in <strong>Phase 4 — Financial Workflow</strong>.
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}