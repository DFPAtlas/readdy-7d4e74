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
  { label: 'Timesheets', href: '/admin/timesheets', icon: 'ri-time-line' },
  { label: 'Invoices', href: '/admin/invoices', icon: 'ri-bill-line' },
  { label: 'Payments', href: '/admin/payments', icon: 'ri-bank-line' },
  { label: 'Freelancers', href: '/admin/freelancers', icon: 'ri-user-line', comingSoon: true },
  { label: 'Documents', href: '/admin/documents', icon: 'ri-folder-line', comingSoon: true },
  { label: 'Compliance', href: '/admin/compliance', icon: 'ri-shield-check-line', comingSoon: true },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
];

interface DashboardCounts {
  newApplications: number;
  underReview: number;
  moreInfo: number;
  approved: number;
  rejected: number;
  suspended: number;
  submittedWeek: number;
  publishedOpportunities: number;
  opportunityApps: number;
  activeAssignments: number;
  totalTasks: number;
  pendingSubmissions: number;
  pendingTimesheets: number;
  issuedInvoices: number;
  totalPayments: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts>({ newApplications: 0, underReview: 0, moreInfo: 0, approved: 0, rejected: 0, suspended: 0, submittedWeek: 0, publishedOpportunities: 0, opportunityApps: 0, activeAssignments: 0, totalTasks: 0, pendingSubmissions: 0, pendingTimesheets: 0, issuedInvoices: 0, totalPayments: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [newApps, review, more, approved, rejected, suspended, weekCount, recent,
               pubOpps, oppApps, activeAssignments, totalTasks, pendingSubs, pendingTs, issuedInv, payCount, revenue] = await Promise.all([
          supabase.from('freelancer_applications').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
          supabase.from('freelancer_applications').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
          supabase.from('freelancer_applications').select('id', { count: 'exact', head: true }).eq('status', 'more_info'),
          supabase.from('freelancer_applications').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('freelancer_applications').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
          supabase.from('freelancer_applications').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
          supabase.from('freelancer_applications').select('id', { count: 'exact', head: true }).gte('submitted_at', weekAgo),
          supabase.from('freelancer_applications').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('work_opportunities').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('opportunity_applications').select('id', { count: 'exact', head: true }),
          supabase.from('assignments').select('id', { count: 'exact', head: true }).not('status', 'in', '("completed","cancelled","archived")'),
          supabase.from('assignment_tasks').select('id', { count: 'exact', head: true }),
          supabase.from('work_submissions').select('id', { count: 'exact', head: true }).in('status', '("submitted","under_review")'),
          supabase.from('timesheets').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
          supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', '("issued","overdue","part_paid")'),
          supabase.from('payments').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('amount'),
        ]);

        if (cancelled) return;

        // Fetch profiles for recent apps
        const recentData = recent.data || [];
        if (recentData.length > 0) {
          const userIds = recentData.map((a: any) => a.user_id);
          const { data: profilesData } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds);
          if (!cancelled && profilesData) {
            const profileMap: Record<string, any> = {};
            profilesData.forEach((p: any) => { profileMap[p.id] = p; });
            recentData.forEach((a: any) => { a.profiles = profileMap[a.user_id] || null; });
          }
        }

        setCounts({
          newApplications: newApps.count || 0,
          underReview: review.count || 0,
          moreInfo: more.count || 0,
          approved: approved.count || 0,
          rejected: rejected.count || 0,
          suspended: suspended.count || 0,
          submittedWeek: weekCount.count || 0,
          publishedOpportunities: pubOpps.count || 0,
          opportunityApps: oppApps.count || 0,
          activeAssignments: activeAssignments.count || 0,
          totalTasks: totalTasks.count || 0,
          pendingSubmissions: pendingSubs.count || 0,
          pendingTimesheets: pendingTs.count || 0,
          issuedInvoices: issuedInv.count || 0,
          totalPayments: payCount.count || 0,
          totalRevenue: (revenue.data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
        });
        setRecentApps(recentData);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const getStatusColor = (status: string) => {
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

  const statCards = [
    { label: 'New Applications', value: counts.newApplications, icon: 'ri-file-add-line', color: 'bg-dfp-blue-50 text-dfp-blue-600' },
    { label: 'Under Review', value: counts.underReview, icon: 'ri-search-eye-line', color: 'bg-amber-50 text-amber-600' },
    { label: 'More Info Required', value: counts.moreInfo, icon: 'ri-question-line', color: 'bg-orange-50 text-orange-600' },
    { label: 'Approved', value: counts.approved, icon: 'ri-check-double-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
    { label: 'Published Opps', value: counts.publishedOpportunities, icon: 'ri-briefcase-line', color: 'bg-dfp-blue-50 text-dfp-blue-600' },
    { label: 'Opp. Applications', value: counts.opportunityApps, icon: 'ri-user-star-line', color: 'bg-amber-50 text-amber-600' },
    { label: 'Active Assignments', value: counts.activeAssignments, icon: 'ri-list-check-3', color: 'bg-dfp-green-50 text-dfp-green-600' },
    { label: 'Total Tasks', value: counts.totalTasks, icon: 'ri-task-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
    { label: 'Pending Submissions', value: counts.pendingSubmissions, icon: 'ri-upload-cloud-2-line', color: 'bg-amber-50 text-amber-600' },
    { label: 'Pending Timesheets', value: counts.pendingTimesheets, icon: 'ri-time-line', color: 'bg-dfp-blue-50 text-dfp-blue-600' },
    { label: 'Open Invoices', value: counts.issuedInvoices, icon: 'ri-bill-line', color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Payments', value: counts.totalPayments, icon: 'ri-bank-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
    { label: 'Revenue', value: `£${Math.round(counts.totalRevenue).toLocaleString('en-GB')}`, icon: 'ri-funds-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
    { label: 'This Week', value: counts.submittedWeek, icon: 'ri-calendar-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
  ];

  if (loading) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900 mb-1">Admin Overview</h1>
        <p className="text-sm text-dfp-stone-500 mb-6">Freelancer applications, marketplace, assignments, and financial dashboard with real-time counts.</p>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <i className={`${stat.icon} text-lg`}></i>
              </div>
              <p className="text-2xl font-bold text-dfp-stone-900">{stat.value}</p>
              <p className="text-[11px] text-dfp-stone-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dfp-stone-100">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Recent Applications</h2>
            <Link to="/admin/applications" className="text-xs font-medium text-dfp-green-700 hover:text-dfp-green-800 cursor-pointer">View all</Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
                <i className="ri-inbox-line text-xl text-dfp-stone-300"></i>
              </div>
              <p className="text-sm text-dfp-stone-400">No applications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-dfp-stone-50">
              {recentApps.map((app: any) => (
                <Link key={app.id} to={`/admin/applications/${app.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-dfp-stone-50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-dfp-stone-900">
                      {app.profiles?.first_name} {app.profiles?.last_name}
                    </p>
                    <p className="text-xs text-dfp-stone-400">{app.profiles?.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap capitalize ${getStatusColor(app.status)}`}>
                      {(app.status || '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-dfp-stone-400">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not submitted'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}