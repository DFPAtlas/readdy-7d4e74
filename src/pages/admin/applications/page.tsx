import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
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

const STATUSES = ['all', 'draft', 'submitted', 'under_review', 'more_info', 'approved', 'rejected', 'suspended'];
const CATEGORIES = ['all', 'Web Development', 'UX and UI Design', 'Software Testing and UAT', 'AI and Automation', 'Data and Research', 'Content and Documentation', 'Cybersecurity and Technical Operations', 'Business and Project Support'];

export default function ApplicationsList() {
  const { profile } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const fetchApps = async () => {
      try {
        setLoading(true);
        let query = supabase.from('freelancer_applications').select('*').order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error: err } = await query;
        if (cancelled) return;
        if (err) throw err;

        let appsData = data || [];

        // Fetch related profiles
        if (appsData.length > 0) {
          const userIds = appsData.map((a: any) => a.user_id);
          const [profilesRes, fpRes] = await Promise.all([
            supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
            supabase.from('freelancer_profiles').select('user_id, primary_category, country').in('user_id', userIds),
          ]);
          if (!cancelled) {
            const profileMap: Record<string, any> = {};
            const fpMap: Record<string, any> = {};
            (profilesRes.data || []).forEach((p: any) => { profileMap[p.id] = p; });
            (fpRes.data || []).forEach((fp: any) => { fpMap[fp.user_id] = fp; });
            appsData.forEach((a: any) => {
              a.profiles = profileMap[a.user_id] || null;
              a.freelancer_profiles = fpMap[a.user_id] || null;
            });
          }
        }

        let filtered = appsData;

        if (categoryFilter !== 'all') {
          filtered = filtered.filter((a: any) => a.freelancer_profiles?.primary_category === categoryFilter);
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter((a: any) =>
            `${a.profiles?.first_name} ${a.profiles?.last_name}`.toLowerCase().includes(q) ||
            (a.profiles?.email || '').toLowerCase().includes(q)
          );
        }

        setApps(filtered);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchApps();
    return () => { cancelled = true; };
  }, [statusFilter, categoryFilter, search]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-dfp-stone-100 text-dfp-stone-600',
      submitted: 'bg-dfp-blue-100 text-dfp-blue-700',
      under_review: 'bg-amber-100 text-amber-700',
      more_info: 'bg-orange-100 text-orange-700',
      approved: 'bg-dfp-green-100 text-dfp-green-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-dfp-stone-100 text-dfp-stone-600';
  };

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-dfp-stone-900">Applications</h1>
            <p className="text-sm text-dfp-stone-500 mt-0.5">{apps.length} applications found</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-dfp-stone-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-xl border border-dfp-stone-200 text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
              <i className="ri-inbox-line text-xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500">No applications match your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-dfp-stone-50 border-b border-dfp-stone-200 text-[11px] font-semibold text-dfp-stone-500 uppercase tracking-wider">
              <div className="col-span-3">Freelancer</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Country</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Submitted</div>
              <div className="col-span-2">Actions</div>
            </div>
            {apps.map((app: any) => (
              <div key={app.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 border-b border-dfp-stone-50 hover:bg-dfp-stone-50/50 transition-colors items-center">
                <div className="md:col-span-3">
                  <p className="text-sm font-medium text-dfp-stone-900">{app.profiles?.first_name} {app.profiles?.last_name}</p>
                  <p className="text-xs text-dfp-stone-400">{app.profiles?.email}</p>
                </div>
                <div className="md:col-span-2 text-sm text-dfp-stone-600">{app.freelancer_profiles?.primary_category || '-'}</div>
                <div className="md:col-span-1 text-sm text-dfp-stone-600">{app.freelancer_profiles?.country || '-'}</div>
                <div className="md:col-span-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap capitalize ${getStatusBadge(app.status)}`}>
                    {(app.status || '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-dfp-stone-400 ml-2">{app.profile_completion || 0}%</span>
                </div>
                <div className="md:col-span-2 text-xs text-dfp-stone-500">
                  {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
                <div className="md:col-span-2">
                  <Link to={`/admin/applications/${app.id}`} className="text-xs font-medium text-dfp-green-700 hover:text-dfp-green-800 cursor-pointer">
                    View Details <i className="ri-arrow-right-line ml-0.5"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}