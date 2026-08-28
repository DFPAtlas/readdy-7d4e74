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

interface Opportunity {
  id: string;
  title: string;
  category: string;
  project_name: string;
  client_label: string;
  location_type: string;
  engagement_type: string;
  budget_range: string;
  estimated_duration: string;
  deadline: string;
  required_skills: string[];
  priority: string;
  status: string;
  published_at: string;
}

export default function OpportunitiesPage() {
  const { profile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [engagementFilter, setEngagementFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('work_opportunities')
          .select('*')
          .eq('status', 'published')
          .order('priority', { ascending: true })
          .order('published_at', { ascending: false });

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setOpportunities(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOpportunities();
    return () => { cancelled = true; };
  }, []);

  const getUniqueCategories = () => {
    const cats = new Set(opportunities.map((o) => o.category));
    return Array.from(cats);
  };

  const filtered = opportunities.filter((o) => {
    const matchesSearch = searchQuery === '' ||
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.required_skills || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
    const matchesEngagement = engagementFilter === 'all' || o.engagement_type === engagementFilter;
    return matchesSearch && matchesCategory && matchesEngagement;
  });

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-amber-100 text-amber-700',
      normal: 'bg-dfp-blue-100 text-dfp-blue-700',
      low: 'bg-dfp-stone-100 text-dfp-stone-500',
    };
    return map[priority] || map.normal;
  };

  const getEngagementLabel = (type: string) => {
    const map: Record<string, string> = {
      hourly: 'Hourly',
      daily: 'Day Rate',
      fixed_fee: 'Fixed Fee',
      milestone: 'Milestone',
    };
    return map[type] || type;
  };

  const getLocationIcon = (type: string) => {
    const map: Record<string, string> = {
      remote: 'ri-global-line',
      on_site: 'ri-building-line',
      hybrid: 'ri-swap-line',
    };
    return map[type] || 'ri-map-pin-line';
  };

  if (profile?.role === 'pending_freelancer') {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dfp-blue-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-hourglass-line text-2xl text-dfp-blue-500"></i>
          </div>
          <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-2">Application Under Review</h2>
          <p className="text-sm text-dfp-stone-500">Work opportunities become available once your freelancer application is approved.</p>
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
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Available Work</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">{opportunities.length} opportunities matching your profile</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6 flex items-center gap-3">
            <i className="ri-error-warning-line"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-dfp-stone-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search by title, project, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400 transition"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer min-w-[140px]"
          >
            <option value="all">All Categories</option>
            {getUniqueCategories().map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={engagementFilter}
            onChange={(e) => setEngagementFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer min-w-[130px]"
          >
            <option value="all">All Types</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Day Rate</option>
            <option value="fixed_fee">Fixed Fee</option>
            <option value="milestone">Milestone</option>
          </select>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
            <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-inbox-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500">
              {searchQuery || categoryFilter !== 'all' || engagementFilter !== 'all'
                ? 'No opportunities match your filters. Try adjusting them.'
                : 'No opportunities available right now. Check back soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((opp) => (
              <Link
                key={opp.id}
                to={`/portal/opportunities/${opp.id}`}
                className="block bg-white rounded-xl border border-dfp-stone-200 p-5 hover:border-dfp-green-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="text-xs font-medium text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{opp.category}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${getPriorityBadge(opp.priority)}`}>{opp.priority}</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-dfp-stone-900 mb-1">{opp.title}</h3>
                    <p className="text-xs text-dfp-stone-500 mb-3">{opp.project_name} — {opp.client_label}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-dfp-stone-600">
                        <i className={`${getLocationIcon(opp.location_type)} text-dfp-stone-400`}></i>
                        <span className="capitalize">{opp.location_type.replace('_', ' ')}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-dfp-stone-600">
                        <i className="ri-money-pound-circle-line text-dfp-stone-400"></i>
                        {opp.budget_range}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-dfp-stone-600">
                        <i className="ri-time-line text-dfp-stone-400"></i>
                        {opp.estimated_duration}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-dfp-stone-600">
                        <i className="ri-calendar-line text-dfp-stone-400"></i>
                        Deadline: {opp.deadline ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}
                      </span>
                    </div>
                    {(opp.required_skills || []).length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        {(opp.required_skills as string[]).slice(0, 4).map((skill: string) => (
                          <span key={skill} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-dfp-green-50 text-dfp-green-700">{skill}</span>
                        ))}
                        {opp.required_skills.length > 4 && (
                          <span className="text-[10px] text-dfp-stone-400">+{opp.required_skills.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 lg:flex-col lg:items-end flex-shrink-0">
                    <span className="text-xs font-semibold text-dfp-green-700 bg-dfp-green-50 px-3 py-1 rounded-full whitespace-nowrap">{getEngagementLabel(opp.engagement_type)}</span>
                    <span className="flex items-center gap-1 text-xs text-dfp-green-600 font-medium whitespace-nowrap">
                      View Details <i className="ri-arrow-right-line"></i>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}