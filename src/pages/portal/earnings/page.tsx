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

interface EarningsSummary {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  totalHours: number;
  invoiceCount: number;
  paidCount: number;
}

export default function EarningsPage() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<EarningsSummary>({ totalBilled: 0, totalPaid: 0, totalOutstanding: 0, totalHours: 0, invoiceCount: 0, paidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monthly breakdown
  const [monthlyData, setMonthlyData] = useState<{ month: string; billed: number; paid: number }[]>([]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [invRes, tsRes] = await Promise.all([
          supabase.from('invoices').select('id, status, total_amount, paid_amount, balance_due').eq('freelancer_id', profile.id),
          supabase.from('timesheets').select('total_hours').eq('freelancer_id', profile.id).eq('status', 'approved'),
        ]);

        if (cancelled) return;

        const invoices = invRes.data || [];
        const totalBilled = invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
        const totalPaid = invoices.reduce((s: number, i: any) => s + Number(i.paid_amount || 0), 0);
        const totalOutstanding = invoices
          .filter((i: any) => !['paid', 'cancelled'].includes(i.status))
          .reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0);
        const totalHours = (tsRes.data || []).reduce((s: number, t: any) => s + Number(t.total_hours || 0), 0);

        // Monthly breakdown
        const monthMap: Record<string, { billed: number; paid: number }> = {};
        invoices.forEach((inv: any) => {
          const month = inv.issue_date ? inv.issue_date.substring(0, 7) : 'unknown';
          if (!monthMap[month]) monthMap[month] = { billed: 0, paid: 0 };
          monthMap[month].billed += Number(inv.total_amount || 0);
          monthMap[month].paid += Number(inv.paid_amount || 0);
        });

        const sorted = Object.entries(monthMap)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 12)
          .map(([month, data]) => ({ month, ...data }));

        if (!cancelled) {
          setSummary({
            totalBilled,
            totalPaid,
            totalOutstanding,
            totalHours,
            invoiceCount: invoices.length,
            paidCount: invoices.filter((i: any) => i.status === 'paid').length,
          });
          setMonthlyData(sorted);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [profile]);

  if (loading) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  const maxBilled = Math.max(...monthlyData.map((m) => m.billed), 1);

  return (
    <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
      <div className="max-w-5xl mx-auto">
        <Link to="/portal/invoices" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to invoices
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Earnings Dashboard</h1>
          <p className="text-sm text-dfp-stone-500 mt-1">Your financial overview across all assignments.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total Billed', value: `£${summary.totalBilled.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'ri-bill-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
            { label: 'Total Paid', value: `£${summary.totalPaid.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'ri-check-double-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
            { label: 'Outstanding', value: `£${summary.totalOutstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'ri-hourglass-line', color: 'bg-amber-50 text-amber-600' },
            { label: 'Billed Hours', value: summary.totalHours.toFixed(0), icon: 'ri-timer-line', color: 'bg-dfp-blue-50 text-dfp-blue-600' },
            { label: 'Invoices', value: summary.invoiceCount.toString(), icon: 'ri-file-list-3-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
            { label: 'Paid Invoices', value: summary.paidCount.toString(), icon: 'ri-bank-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
              <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <i className={`${card.icon} text-base`}></i>
              </div>
              <p className="text-lg font-bold text-dfp-stone-900 truncate">{card.value}</p>
              <p className="text-[11px] text-dfp-stone-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-8">
          <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Monthly Breakdown</h2>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-dfp-stone-400">No invoice data yet.</p>
          ) : (
            <div className="space-y-3">
              {monthlyData.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-dfp-stone-500 w-24 flex-shrink-0">
                    {new Date(m.month + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-5 bg-dfp-stone-100 rounded overflow-hidden relative">
                        <div
                          className="h-full bg-dfp-green-500 rounded transition-all"
                          style={{ width: `${maxBilled > 0 ? (m.billed / maxBilled) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-dfp-stone-700 w-20 text-right">£{m.billed.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {m.paid > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-dfp-stone-100 rounded overflow-hidden relative">
                          <div
                            className="h-full bg-dfp-green-300 rounded transition-all"
                            style={{ width: `${maxBilled > 0 ? (m.paid / maxBilled) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-dfp-green-600 w-20 text-right">£{m.paid.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-6 pt-3 border-t border-dfp-stone-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-dfp-green-500"></div>
                  <span className="text-[10px] text-dfp-stone-500">Billed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-dfp-green-300"></div>
                  <span className="text-[10px] text-dfp-stone-500">Paid</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/portal/invoices" className="bg-white rounded-xl border border-dfp-stone-200 p-5 hover:border-dfp-green-300 transition-colors cursor-pointer flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
              <i className="ri-bill-line text-dfp-stone-500 text-lg"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-dfp-stone-900">View All Invoices</p>
              <p className="text-xs text-dfp-stone-500">{summary.invoiceCount} invoices · {summary.paidCount} paid</p>
            </div>
          </Link>
          <Link to="/portal/timesheets" className="bg-white rounded-xl border border-dfp-stone-200 p-5 hover:border-dfp-green-300 transition-colors cursor-pointer flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
              <i className="ri-time-line text-dfp-stone-500 text-lg"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-dfp-stone-900">Manage Timesheets</p>
              <p className="text-xs text-dfp-stone-500">{summary.totalHours.toFixed(0)} approved hours</p>
            </div>
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
}