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
  { label: 'Timesheets', href: '/portal/timesheets', icon: 'ri-time-line' },
  { label: 'Invoices', href: '/portal/invoices', icon: 'ri-bill-line' },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

interface Timesheet {
  id: string;
  reference: string;
  assignment_id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  billable_hours: number;
  hourly_rate: number;
  currency: string;
  total_amount: number;
  assignment: { id: string; title: string; reference: string } | null;
  created_at: string;
  submitted_at: string | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-dfp-stone-100 text-dfp-stone-600' },
  submitted: { label: 'Submitted', color: 'bg-dfp-blue-100 text-dfp-blue-700' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-dfp-green-100 text-dfp-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  invoiced: { label: 'Invoiced', color: 'bg-dfp-green-100 text-dfp-green-700' },
};

export default function TimesheetsPage() {
  const { profile } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const fetchTimesheets = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('timesheets')
          .select('*, assignment:assignments(id, title, reference)')
          .eq('freelancer_id', profile.id)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setTimesheets(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTimesheets();
    return () => { cancelled = true; };
  }, [profile]);

  const filteredTimesheets = filter === 'all'
    ? timesheets
    : timesheets.filter((t) => t.status === filter);

  const counts = {
    all: timesheets.length,
    draft: timesheets.filter((t) => t.status === 'draft').length,
    submitted: timesheets.filter((t) => t.status === 'submitted').length,
    approved: timesheets.filter((t) => t.status === 'approved').length,
    rejected: timesheets.filter((t) => t.status === 'rejected').length,
  };

  const filterPills = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'submitted', label: 'Submitted', count: counts.submitted },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

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
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">My Timesheets</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">Track your billable hours and submit for approval.</p>
          </div>
          <Link
            to="/portal/timesheets/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line"></i> New Timesheet
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Hours', value: timesheets.reduce((s, t) => s + Number(t.total_hours || 0), 0).toFixed(1), icon: 'ri-timer-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
            { label: 'Billable Hours', value: timesheets.reduce((s, t) => s + Number(t.billable_hours || 0), 0).toFixed(1), icon: 'ri-money-pound-circle-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
            { label: 'Total Value', value: `£${timesheets.reduce((s, t) => s + Number(t.total_amount || 0), 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'ri-bank-line', color: 'bg-dfp-blue-50 text-dfp-blue-600' },
            { label: 'Approved', value: `${counts.approved} sheets`, icon: 'ri-check-double-line', color: 'bg-amber-50 text-amber-600' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
              <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <i className={`${card.icon} text-base`}></i>
              </div>
              <p className="text-xl font-bold text-dfp-stone-900">{card.value}</p>
              <p className="text-[11px] text-dfp-stone-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {filterPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === pill.key
                  ? 'bg-dfp-green-600 text-white'
                  : 'bg-white text-dfp-stone-500 hover:bg-dfp-stone-50 border border-dfp-stone-200'
              }`}
            >
              {pill.label}
              <span className="ml-1 opacity-60">{pill.count}</span>
            </button>
          ))}
        </div>

        {/* Timesheets list */}
        {filteredTimesheets.length === 0 ? (
          <div className="bg-white rounded-xl border border-dfp-stone-200 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-time-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500 mb-1">
              {filter !== 'all' ? `No ${filter.replace('_', ' ')} timesheets` : 'No timesheets yet'}
            </p>
            <p className="text-xs text-dfp-stone-400 mb-4">Create a timesheet to start tracking your billable hours.</p>
            <Link
              to="/portal/timesheets/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer"
            >
              <i className="ri-add-line"></i> New Timesheet
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
            <div className="divide-y divide-dfp-stone-100">
              {filteredTimesheets.map((ts) => {
                const s = statusMap[ts.status] || statusMap.draft;
                return (
                  <Link
                    key={ts.id}
                    to={`/portal/timesheets/${ts.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-dfp-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
                        <i className="ri-calendar-check-line text-dfp-stone-500"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dfp-stone-900 truncate">
                          {ts.assignment?.title || `Timesheet ${ts.reference}`}
                        </p>
                        <p className="text-xs text-dfp-stone-400 mt-0.5">
                          {ts.reference} · {new Date(ts.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(ts.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-dfp-stone-900">{ts.total_hours}h</p>
                        <p className="text-xs text-dfp-stone-400">{ts.currency} {Number(ts.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>
                        {s.label}
                      </span>
                      <i className="ri-arrow-right-s-line text-dfp-stone-400"></i>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}