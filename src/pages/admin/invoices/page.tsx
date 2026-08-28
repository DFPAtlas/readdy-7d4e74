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
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
];

interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  currency: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  freelancer: { id: string; first_name: string; last_name: string; email: string } | null;
  assignment: { id: string; title: string; reference: string } | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-dfp-stone-100 text-dfp-stone-600' },
  issued: { label: 'Issued', color: 'bg-dfp-blue-100 text-dfp-blue-700' },
  part_paid: { label: 'Part Paid', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Paid', color: 'bg-dfp-green-100 text-dfp-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-dfp-stone-100 text-dfp-stone-400' },
};

export default function AdminInvoicesPage() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('invoices')
          .select('*, freelancer:profiles!invoices_freelancer_id_fkey(id, first_name, last_name, email), assignment:assignments(id, title, reference)')
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setInvoices(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filteredInvoices = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

  const counts = {
    all: invoices.length,
    issued: invoices.filter((i) => i.status === 'issued').length,
    part_paid: invoices.filter((i) => i.status === 'part_paid').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
  };

  const totalOutstanding = invoices.filter((i) => ['issued', 'part_paid', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.balance_due || 0), 0);
  const totalCollected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount || 0), 0);

  const filterPills = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'issued', label: 'Issued', count: counts.issued },
    { key: 'part_paid', label: 'Part Paid', count: counts.part_paid },
    { key: 'paid', label: 'Paid', count: counts.paid },
    { key: 'overdue', label: 'Overdue', count: counts.overdue },
  ];

  if (loading) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Invoice Management</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">Manage all freelancer invoices and track payments.</p>
          </div>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-dfp-stone-200 text-dfp-stone-700 text-sm font-medium rounded-lg hover:bg-dfp-stone-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-bank-line"></i> All Payments
          </Link>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>}

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Outstanding', value: `£${totalOutstanding.toLocaleString('en-GB')}`, icon: 'ri-hourglass-line', color: 'bg-amber-50 text-amber-600' },
            { label: 'Collected', value: `£${totalCollected.toLocaleString('en-GB')}`, icon: 'ri-check-double-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
            { label: 'Total Invoices', value: counts.all.toString(), icon: 'ri-bill-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
            { label: 'Overdue', value: counts.overdue.toString(), icon: 'ri-error-warning-line', color: 'bg-red-50 text-red-600' },
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

        {/* Filters */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {filterPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === pill.key ? 'bg-dfp-green-600 text-white' : 'bg-white text-dfp-stone-500 hover:bg-dfp-stone-50 border border-dfp-stone-200'
              }`}
            >
              {pill.label} <span className="ml-1 opacity-60">{pill.count}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-dfp-stone-200 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-bill-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500">No invoices found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
            <div className="divide-y divide-dfp-stone-100">
              {filteredInvoices.map((inv) => {
                const s = statusMap[inv.status] || statusMap.draft;
                const isUrgent = inv.status === 'overdue' || (inv.status === 'issued' && inv.due_date && new Date(inv.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                return (
                  <Link
                    key={inv.id}
                    to={`/admin/invoices/${inv.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-dfp-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${inv.status === 'overdue' ? 'bg-red-50' : 'bg-dfp-stone-50'}`}>
                        <i className={`text-lg ${inv.status === 'overdue' ? 'ri-error-warning-line text-red-500' : 'ri-bill-line text-dfp-stone-500'}`}></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-dfp-stone-900">{inv.invoice_number}</p>
                          {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>}
                        </div>
                        <p className="text-xs text-dfp-stone-400 mt-0.5">
                          {inv.freelancer?.first_name} {inv.freelancer?.last_name} · {inv.assignment?.title || '—'} · {new Date(inv.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-dfp-stone-900">{inv.currency} {Number(inv.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <p className="text-xs text-dfp-stone-400">Balance: {inv.currency} {Number(inv.balance_due || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
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