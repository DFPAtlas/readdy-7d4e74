import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

interface AppWithDetails {
  id: string;
  opportunity_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_rate: number;
  rate_type: string;
  currency: string;
  status: string;
  submitted_at: string;
  review_notes: string;
  profile: any;
  opportunity: any;
}

export default function AdminOpportunityApplicationsPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const oppFilter = searchParams.get('opportunity') || '';

  const [applications, setApplications] = useState<AppWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let query = supabase.from('opportunity_applications').select('*').order('submitted_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (oppFilter) query = query.eq('opportunity_id', oppFilter);

      const { data: apps, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const appData = apps || [];
      if (appData.length > 0) {
        const userIds = [...new Set(appData.map((a: any) => a.freelancer_id))];
        const oppIds = [...new Set(appData.map((a: any) => a.opportunity_id))];

        const [{ data: profilesData }, { data: oppsData }] = await Promise.all([
          supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
          supabase.from('work_opportunities').select('id, title, project_name, category').in('id', oppIds),
        ]);

        const profileMap: Record<string, any> = {};
        (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });
        const oppMap: Record<string, any> = {};
        (oppsData || []).forEach((o: any) => { oppMap[o.id] = o; });

        setApplications(appData.map((a: any) => ({
          ...a,
          profile: profileMap[a.freelancer_id] || null,
          opportunity: oppMap[a.opportunity_id] || null,
        })));
      } else {
        setApplications([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, oppFilter]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'under_review' || newStatus === 'shortlisted' || newStatus === 'accepted' || newStatus === 'declined') {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewer_id = profile?.id;
      }
      const { error: updateError } = await supabase.from('opportunity_applications').update(updates).eq('id', appId);
      if (updateError) throw updateError;
      setActionMsg(`Application ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setActionMsg(null), 3000);
      fetchApplications();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      submitted: 'bg-dfp-blue-100 text-dfp-blue-700',
      under_review: 'bg-amber-100 text-amber-700',
      shortlisted: 'bg-dfp-green-100 text-dfp-green-700',
      accepted: 'bg-dfp-green-100 text-dfp-green-700',
      declined: 'bg-red-100 text-red-700',
      withdrawn: 'bg-dfp-stone-100 text-dfp-stone-500',
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

  const statuses = ['submitted', 'under_review', 'shortlisted', 'accepted', 'declined'];

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Opportunity Applications</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>}
        {actionMsg && <div className="p-3 bg-dfp-green-50 border border-dfp-green-100 rounded-lg text-sm text-dfp-green-700 mb-4">{actionMsg}</div>}

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap ${statusFilter === 'all' ? 'bg-dfp-stone-800 text-white' : 'bg-white border border-dfp-stone-200 text-dfp-stone-600'}`}>All</button>
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap capitalize ${statusFilter === s ? 'bg-dfp-stone-800 text-white' : 'bg-white border border-dfp-stone-200 text-dfp-stone-600'}`}>{s.replace('_', ' ')}</button>
          ))}
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
            <p className="text-sm text-dfp-stone-500">No applications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-dfp-stone-900">
                        {app.profile?.first_name} {app.profile?.last_name}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${getStatusBadge(app.status)}`}>{app.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-dfp-stone-500 mb-1">
                      {app.opportunity?.title || 'Unknown Opportunity'}
                      {app.opportunity?.project_name ? ` — ${app.opportunity.project_name}` : ''}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-dfp-stone-400 flex-wrap">
                      {app.proposed_rate && <span>{app.currency} {app.proposed_rate}/{app.rate_type}</span>}
                      <span>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                      <span>{app.profile?.email}</span>
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-dfp-stone-600 mt-2 line-clamp-2">{app.cover_letter}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    {app.status === 'submitted' && (
                      <button onClick={() => handleStatusUpdate(app.id, 'under_review')} className="px-2.5 py-1.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer whitespace-nowrap">Start Review</button>
                    )}
                    {(app.status === 'submitted' || app.status === 'under_review') && (
                      <button onClick={() => handleStatusUpdate(app.id, 'shortlisted')} className="px-2.5 py-1.5 text-[10px] font-medium rounded bg-dfp-green-50 text-dfp-green-700 hover:bg-dfp-green-100 cursor-pointer whitespace-nowrap">Shortlist</button>
                    )}
                    {app.status !== 'accepted' && app.status !== 'declined' && (
                      <>
                        <button onClick={() => handleStatusUpdate(app.id, 'accepted')} className="px-2.5 py-1.5 text-[10px] font-medium rounded bg-dfp-green-50 text-dfp-green-700 hover:bg-dfp-green-100 cursor-pointer whitespace-nowrap">Accept</button>
                        <button onClick={() => handleStatusUpdate(app.id, 'declined')} className="px-2.5 py-1.5 text-[10px] font-medium rounded bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer whitespace-nowrap">Decline</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}