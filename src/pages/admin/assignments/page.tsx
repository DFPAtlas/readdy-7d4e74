import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

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

interface AssignmentWithProfile {
  id: string;
  reference: string;
  title: string;
  project_name: string;
  client_label: string;
  freelancer_id: string;
  engagement_type: string;
  agreed_rate: number;
  currency: string;
  deadline: string;
  status: string;
  created_at: string;
  profile: any;
}

export default function AdminAssignmentsPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', freelancer_email: '', engagement_type: 'hourly', agreed_rate: '', currency: 'GBP',
    start_date: '', deadline: '', scope_summary: '', project_name: '', client_label: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      let query = supabase.from('assignments').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const assignmentData = data || [];
      if (assignmentData.length > 0) {
        const userIds = [...new Set(assignmentData.map((a: any) => a.freelancer_id))];
        const { data: profilesData } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });
        setAssignments(assignmentData.map((a: any) => ({ ...a, profile: profileMap[a.freelancer_id] || null })));
      } else {
        setAssignments([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: freelancer } = await supabase.from('profiles').select('id').eq('email', createForm.freelancer_email).eq('role', 'freelancer').maybeSingle();
      if (!freelancer) { setError('Freelancer not found. Make sure the email belongs to an approved freelancer.'); return; }

      const ref = `DFP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      const { error: insertError } = await supabase.from('assignments').insert({
        title: createForm.title,
        freelancer_id: freelancer.id,
        engagement_type: createForm.engagement_type,
        agreed_rate: createForm.agreed_rate ? parseFloat(createForm.agreed_rate) : null,
        currency: createForm.currency,
        start_date: createForm.start_date || null,
        deadline: createForm.deadline || null,
        scope_summary: createForm.scope_summary || null,
        project_name: createForm.project_name || null,
        client_label: createForm.client_label || null,
        reference: ref,
        status: 'pending_setup',
        created_by: profile?.id,
        project_manager_id: profile?.id,
      });

      if (insertError) throw insertError;
      setShowCreate(false);
      setCreateForm({ title: '', freelancer_email: '', engagement_type: 'hourly', agreed_rate: '', currency: 'GBP', start_date: '', deadline: '', scope_summary: '', project_name: '', client_label: '' });
      fetchAssignments();
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

  const activeStatuses = ['pending_setup', 'awaiting_agreements', 'ready_to_start', 'in_progress', 'paused', 'submitted', 'under_review', 'changes_requested', 'approved'];

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Assignments</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">{assignments.length} total</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer">
            <i className="ri-add-line mr-1.5"></i> New Assignment
          </button>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>}

        {showCreate && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 mb-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Create Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Title *</label>
                  <input type="text" required value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Freelancer Email *</label>
                  <input type="email" required value={createForm.freelancer_email} onChange={(e) => setCreateForm((p) => ({ ...p, freelancer_email: e.target.value }))} placeholder="Approved freelancer email" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Rate</label>
                  <input type="number" value={createForm.agreed_rate} onChange={(e) => setCreateForm((p) => ({ ...p, agreed_rate: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Start</label>
                  <input type="date" value={createForm.start_date} onChange={(e) => setCreateForm((p) => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Deadline</label>
                  <input type="date" value={createForm.deadline} onChange={(e) => setCreateForm((p) => ({ ...p, deadline: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Scope Summary</label>
                <textarea value={createForm.scope_summary} onChange={(e) => setCreateForm((p) => ({ ...p, scope_summary: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400 resize-none"></textarea>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap">{saving ? 'Creating...' : 'Create Assignment'}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm text-dfp-stone-500 cursor-pointer whitespace-nowrap">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap ${statusFilter === 'all' ? 'bg-dfp-stone-800 text-white' : 'bg-white border border-dfp-stone-200 text-dfp-stone-600'}`}>All</button>
          {activeStatuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap capitalize ${statusFilter === s ? 'bg-dfp-stone-800 text-white' : 'bg-white border border-dfp-stone-200 text-dfp-stone-600'}`}>{s.replace(/_/g, ' ')}</button>
          ))}
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
            <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-list-check-3 text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500">No assignments yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dfp-stone-100">
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Ref</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Title</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Freelancer</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Rate</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Deadline</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Status</th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dfp-stone-50">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-dfp-stone-50 transition-colors">
                      <td className="px-5 py-3.5"><span className="text-[10px] font-mono text-dfp-stone-400">{a.reference || '—'}</span></td>
                      <td className="px-5 py-3.5"><p className="text-sm font-medium text-dfp-stone-900">{a.title}</p></td>
                      <td className="px-5 py-3.5"><p className="text-xs text-dfp-stone-600">{a.profile?.first_name} {a.profile?.last_name}</p></td>
                      <td className="px-5 py-3.5"><span className="text-xs text-dfp-stone-600">{a.agreed_rate ? `${a.currency} ${a.agreed_rate}` : '—'}</span></td>
                      <td className="px-5 py-3.5"><span className="text-xs text-dfp-stone-500">{a.deadline ? new Date(a.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span></td>
                      <td className="px-5 py-3.5"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${getStatusBadge(a.status)}`}>{a.status.replace(/_/g, ' ')}</span></td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/admin/assignments/${a.id}`} className="text-xs font-medium text-dfp-green-700 hover:text-dfp-green-800 cursor-pointer whitespace-nowrap">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}