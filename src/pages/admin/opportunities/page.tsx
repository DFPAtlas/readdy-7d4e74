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

interface Opportunity {
  id: string;
  title: string;
  category: string;
  project_name: string;
  engagement_type: string;
  budget_range: string;
  status: string;
  priority: string;
  published_at: string;
  created_at: string;
}

export default function AdminOpportunitiesPage() {
  const { profile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      let query = supabase.from('work_opportunities').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setOpportunities(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-dfp-stone-100 text-dfp-stone-500',
      published: 'bg-dfp-green-100 text-dfp-green-700',
      closed: 'bg-dfp-stone-100 text-dfp-stone-500',
      filled: 'bg-dfp-blue-100 text-dfp-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      archived: 'bg-dfp-stone-50 text-dfp-stone-400',
    };
    return map[status] || 'bg-dfp-stone-100 text-dfp-stone-500';
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-amber-100 text-amber-700',
      normal: 'bg-dfp-blue-100 text-dfp-blue-700',
      low: 'bg-dfp-stone-100 text-dfp-stone-500',
    };
    return map[priority] || map.normal;
  };

  if (loading) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>
      </PortalLayout>
    );
  }

  const statuses = ['draft', 'published', 'closed', 'filled', 'cancelled'];

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Work Opportunities</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">Manage published work opportunities for freelancers</p>
          </div>
          <Link
            to="/admin/opportunities/new"
            className="px-4 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line mr-1.5"></i> New Opportunity
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>
        )}

        {/* Status filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap ${statusFilter === 'all' ? 'bg-dfp-stone-800 text-white' : 'bg-white border border-dfp-stone-200 text-dfp-stone-600'}`}>
            All ({opportunities.length})
          </button>
          {statuses.map((s) => {
            const count = opportunities.filter((o) => o.status === s).length;
            if (count === 0 && statusFilter !== s) return null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap capitalize ${statusFilter === s ? 'bg-dfp-stone-800 text-white' : 'bg-white border border-dfp-stone-200 text-dfp-stone-600'}`}>
                {s.replace('_', ' ')} ({count})
              </button>
            );
          })}
        </div>

        {opportunities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
            <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-briefcase-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500 mb-3">No opportunities yet</p>
            <Link to="/admin/opportunities/new" className="text-sm font-medium text-dfp-green-700">Create your first opportunity</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dfp-stone-100">
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Title</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Project</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Category</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Budget</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Status</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3">Priority</th>
                    <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-dfp-stone-400 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dfp-stone-50">
                  {opportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-dfp-stone-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-dfp-stone-900">{opp.title}</p>
                        <p className="text-[11px] text-dfp-stone-400 mt-0.5">{opp.engagement_type.replace('_', ' / ')}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-dfp-stone-600">{opp.project_name || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-dfp-stone-600">{opp.category}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-dfp-stone-600">{opp.budget_range}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${getStatusBadge(opp.status)}`}>{opp.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${getPriorityBadge(opp.priority)}`}>{opp.priority}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/admin/opportunities/${opp.id}`} className="text-xs font-medium text-dfp-green-700 hover:text-dfp-green-800 cursor-pointer whitespace-nowrap">Manage</Link>
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